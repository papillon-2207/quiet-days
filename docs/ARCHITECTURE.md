# 架構與資料契約

## 決策

採原生 JavaScript ES modules、HTML、CSS、IndexedDB、Web Crypto 與 Service Worker。沒有 React／Vite 或其他執行期套件；這不是假裝已建置某個框架的模板。Node 僅用於本機伺服器、建置與測試，部署後不需要 Node。瀏覽器載入自身靜態模組，不從 CDN 載入程式或字型。

核心流程：使用者控制 → 編輯器草稿 → 每次事件或 450ms 文字停頓 → schema 驗證 → AES-GCM 加密 → IndexedDB 比對版本後寫入 → 更新解鎖中的記憶體 → 文字回饋。加密作業發生在資料庫 transaction 之外，避免等待加密導致交易自動結束。

## 模組邊界

`src/app.js` 管理頁面、解鎖、鎖定、提醒與編輯器生命週期。`components/` 只以 DOM API 建構介面。`domain/model.js` 是唯一資料契約與修正入口；`domain/dates.js` 區分民用日期與時間戳。`domain/analysis.js` 只產生可解釋的描述，不修改紀錄。`lib/storage.js` 持有序列化寫入佇列與單一 vault；`lib/crypto.js` 加解密；`domain/export.js` 明確執行欄位範圍。

## 資料結構

`version: 1`。同一日期只有一份每日摘要；每一種症狀也只有一個彙總，不是同日多次偏頭痛發作的精細事件系統。

`records[YYYY-MM-DD]` 包含 status、bleeding、flow、periodStart、periodEnd、continuity、leakage、productChanges、symptoms、context、confidence、note、createdAt、updatedAt、verifiedAt、provenance、history。

status 是 marked / none / unsure / skipped / details。bleeding 是 unknown / none / possible / spotting / confirmed。沒有任何症狀可自動令 periodStart 為真；只有使用者勾選「已確認這一天是開始」，且出血為 confirmed 才成立。

symptoms 的鍵為 headache、fatigue、sleep、abdomen、gut、mood、focus、other。每項保存 presence、impact、timing、durationMinutes、location、companions、note。presence 不存在＝未詢問或未記；unsure＝明確不確定；absent＝明確沒有；present＝有。每日 none 明示沒有本日誌追蹤的不適，並不是沒有出血。不得和任何 present 症狀共存。

context 的睡眠、壓力、生病、藥物改變、背景與處理措施全部選填，不要求性行為、懷孕、流產或精確藥名。

## 來源與歷程

民用日期 `date` 是使用者選的症狀日期。每份 provenance 保存實際 `at`、當時本地 `recordedDay`、IANA 時區名稱、same-day / next-day / later 與 afterStartRecall。same-day 只表示當日填寫，不能稱為當下採樣。補登後確認 verifiedAt 不會改寫最初來源。

每次修改保存該日上一版摘要；symptom:id 保存該症狀最近一次變更的取得時間，完整前版在 history。這是可修正的個人日誌，不是不可竄改的醫療稽核；復原可移除最近版本，刪除可移除整個歷程。請勿把加密／版本號當作防篡改臨床研究證據。

本版不支援未知日期事件或跨數天的模糊日期範圍。可將回憶標為不確定，但不應將不確定開始日勾成已確認。下一版需用獨立事件模型處理日期範圍，不能把範圍中的每天都填成有症狀。

## 防止丟失與覆蓋

Vault.update 序列化所有變更。加密 envelope 有隨機 UUID 與單調 revision；compareWrite 在同一 readwrite transaction 中讀取當前值並比較 UUID/revision，才允許 put 或 delete。另頁較新資料會導致明確衝突，不 silently last-write-wins。還原產生新 UUID，避免 ABA 舊分頁誤認同一版本。

編輯器另外只有一個 drain promise。舊寫入失敗時把未儲存 patch 合回 pending，較新欄位優先；不能讓一份失敗的舊文字日後重播覆蓋成功的新文字。離開、鎖定都等待 drain。失敗時保留草稿並要求重試；背景鎖定失敗會遮蔽畫面並說明記憶體仍未清除，而非假稱已鎖。

頁面強制關閉、作業系統終止、斷電可能早於非同步儲存完成；beforeunload 不是零遺失保證。沒有偷偷把未儲存明文放進 localStorage 的 fallback。

## 加密與備份

PBKDF2-SHA256：600,000 次、16-byte 隨機 salt。AES-GCM：256-bit 非可匯出密鑰、12-byte 隨機 IV，預設 128-bit tag。AAD 綁定格式、UUID 與 revision。密語 12–256 UTF-16 字元（例如部分 emoji 佔兩個）；允許中文、空白、貼上與密碼管理員。此 KDF 是依瀏覽器可用標準所作的工程取捨，非 FIPS 認證宣告。密語強度仍重要。

IndexedDB 只保存 envelope；它仍暴露格式、salt、IV、密文長度、UUID 與 revision，並非完全隱匿使用行為。鍵與資料在解鎖 RAM，JavaScript 無法保證所有字串／垃圾回收副本立即清零。Raw plaintext bytes 在可控制處清空，但不聲稱記憶體安全抹除。

加密備份上限 12 MiB；明文 JSON 加密前上限為此值 70%。單筆文字最多 2,000 字、位置 200 字；最多 10,000 日期與每日期 5,000 修正，不是建議累積到上限；實際受密文大小和裝置資源限制。錯誤不觸發自動刪資料。

## 部署與 PWA

Build 將 index、src、public 複製到 dist；依靜態檔雜湊命名離線 cache，只 precache 自身程式。沒有健康資料進 CacheStorage，沒有 push endpoint。更新不 skipWaiting；等所有舊分頁關閉後啟用新殼。部署必須原子更新整份 dist，不單獨覆蓋某一 JS。

單一來源只支援一份 vault；不同路徑共用同來源 IndexedDB，不能當成多使用者隔離。正式使用應採專用 HTTPS origin，避免其他同來源程式或分析腳本取得解鎖資料。
