# 測試報告：0.1.0 / 2026-09-06

## 本次實際結果

| 範圍 | 命令／證據 | 結果 | 不代表什麼 |
|---|---|---|---|
| 語法、imports、靜態不變條件 | npm run check | 通過 | 不是 TypeScript 型別檢查、第三方安全稽核 |
| Node 資料／加密／匯出／伺服器 | npm test；evidence/unit-tests.log | 53 項通過 | 不是 browser IndexedDB 真實交易驗證 |
| Chromium 元件 DOM | npm run test:ui；evidence/ui-tests.json | 31 項通過 | 不是 served-origin E2E、不是讀屏使用者測試 |
| 生產建置 | npm run build | 成功 | 不是已公開部署 |
| 真實網址無 mock E2E | npm run test:browser；evidence/browser-tests.json | **BLOCKED，0 個檢查完成** | 不得改寫成通過或略過後的 release 成功 |

環境：Node 22.16.0；Python 3.13；Playwright 1.57.0；Chromium 144.0.7559.96。瀏覽器的受管理 URL 政策導致 localhost 載入回報 ERR_BLOCKED_BY_ADMINISTRATOR。沒有修改或繞過這項政策。

DOM 測試在 about:blank 載入真實 production 元件的測試 bundle，使用明示的記憶體 demo adapter。它能測按鈕、表單、焦點、失敗後保留輸入、文字輸出等；但**不能證明 native ESM、CSP、Web Crypto/IndexedDB/PWA 在同一 origin 正確整合**。測試 bundle 不會進 dist。

## 53 項 Node 測試涵蓋

民用日期／閏日／時區、補登來源、日期驗證、明確無症狀與未知分離、非法矛盾狀態拒絕、出血錨點規則、修正歷史、復原、保守週期區間、缺失分母、經前與其他日期的觀察、回憶比率、使用者暫停、CSV 防公式、HTML escaping、資料分享範圍、提醒頻率、加密往返、密語驗證、隨機 IV、竄改失敗、備份大小、記憶體 demo 寫入佇列、語音能力偵測、HTTP headers/MIME/公開檔案白名單、無第三方 runtime 套件。

密碼學測試是功能測試；PBKDF2/AES-GCM 正確往返不等於整個應用已通過密碼學審查。

## 31 項 DOM 檢查涵蓋

密語標籤／autocomplete、解鎖前求助、dialog 焦點回復與唯一 ID、快速記號／復原、不確定不捏造資料、症狀影響與時段、自動儲存、舊寫入失敗不得覆蓋新文字、儲存失敗仍能求助、離頁等待存檔、互斥狀態、補登提示與來源、過去日期不得選「剛剛」、出血開始需確認、經後回顧來源、備註選擇性匯出、惡意字串以純文字呈現、大字／高對比、稱呼偏好、320 CSS px 無水平溢出、快速按鈕尺寸、文字版模式摘要、控制項名稱、JavaScript 錯誤。

曾發現並修正：編輯器舊寫入失敗後可能蓋回更新內容的競態；日誌整體「沒有不適」與已記錄症狀矛盾；隱私輸出預覽；求助入口不應被儲存失敗擋住；非出現狀態的匯出不應顯示舊有影響程度。相關迴歸測試留在專案。

## 尚未完成

真實 origin 載入後建立加密日誌、重新啟動保留、跨分頁 CAS、離線冷啟動、備份下載與還原、不同主機部署、iOS/Android 實機、讀屏、點字顯示器、中文本機語音、真實使用者 5–10 秒目標、2–3 個週期共創試用、臨床效度、完整 WCAG 2.2 AA 稽核、資安專業審查。

## 正常環境重跑

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm run verify:release
```

有自訂 Chromium 時可設 CHROMIUM_EXECUTABLE；它是測試執行檔位置，不是繞過政策。若環境封鎖本機網址，換到允許測試的正常環境；不要刪掉驗證、mock 真實儲存、停用安全政策或修改報告來假裝通過。

`verify` 不包含真實網址 E2E，`verify:release` 才包含。後者遇到 blocked 會回傳非零退出碼。任何程式修改後，必須重跑並保留新的日期與 commit（本次是交付檔案快照，沒有建立 Git commit）。

## 證據檔

01-welcome.png、02-demo.png、03-mobile-large-text.png、04-insights.png 均為隔離 DOM 測試的**虛構資料介面**。不能用它們證明真實病患資料、已部署站台或 PWA 持久化。
