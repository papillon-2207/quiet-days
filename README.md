# quiet-days

**低負擔、以視障需求為出發點的個人身體與週期日誌。** 版本 `0.1.0`，研究查核日期 `2026-09-06`。

今天只留記號；有餘力再補充。出血、症狀與生活情境分開記，補登保留來源。沒有帳號、後端、廣告、分析 SDK、第三方字型或模型 API。

## 立即啟動

環境：Node.js 22 以上。本次實測 Node `22.16.0`。**沒有 npm 相依套件，不必先 npm install。**

```sh
npm run dev
```

在瀏覽器開啟終端列出的 `http://127.0.0.1:4173/`。開發模式不註冊 Service Worker。

壓縮包已附 `dist/`，可直接將 **dist 內的內容** 發布到 HTTPS 靜態主機；不要發布整個專案。修改程式後：

```sh
npm run build
npm run preview
```

`preview` 使用相同本機網址，提供建置後的 PWA。不能靠雙擊 HTML 開啟模組程式。正式環境需要 HTTPS、正確的 JavaScript MIME，以及能使用 IndexedDB 與 Web Crypto 的瀏覽器。詳見 [部署文件](docs/DEPLOYMENT.md)。

## 已實作的使用流程

| 使用者需求 | 畫面與行為 |
|---|---|
| 今天很累 | 一次啟動「有不適，先留記號」；也能選沒有不適、不確定、略過 |
| 可以多記一點 | 選一種症狀，先回答活動影響與大約時段；其餘摺疊且選填 |
| 想補昨天 | 不必找月曆；「補昨天」直接進入，標示隔日回憶 |
| 出血後才想起前幾天 | 自己確認開始日後，提供最近 1–3 天的中立回顧 |
| 不確定有沒有出血 | 不確定、沒有、可能有、可能點狀出血、已確認五種狀態 |
| 理解個人模式 | 已確認開始日、缺失情況、症狀觀察分母及回憶比例的文字摘要 |
| 資料隱私 | 先 AES-GCM 加密再存入 IndexedDB；密鑰只在解鎖記憶體 |
| 備份或分享 | 完整加密 `.qdays`；自行選擇日期／欄位的 TXT、CSV、HTML |
| 提醒 | 選配站內提醒、兩小時延後、暫停七天，以及中性 `.ics` 匯出 |
| 可及性 | 原生 HTML 控制、讀屏名稱、焦點管理、大字、高對比、文字表格 |
| 想用語音 | 僅在瀏覽器確認本機 `zh-TW` 辨識可用時啟用；不支援就保留文字 |

首頁「體驗空白日誌」不需要密語、不持久保存。示範模式所有資料都是虛構，請勿輸入真實健康資訊。建立正式日誌後，資料只存在該瀏覽器／網址中；忘記密語無法找回。

## 很重要的邊界

這是**可部署的個人追蹤 MVP，不是已完成臨床、資安或視障使用者驗收的正式醫療產品**。PMS／PMDD 正式量表、診斷、排卵／安全期、生育力推論、雲端同步、穿戴整合、系統級背景提醒不包含在本版。未完成的項目沒有用假按鈕充當已實作功能。

當日填寫不等於症狀發生當下；補登不等於前瞻性臨床資料。缺失、不確定、未詢問與「沒有症狀」不能互換。週期範圍是明示方法的描述性啟發式，**不是經校準的預測機率**。

純前端不能保證關閉網頁後準時通知。裝置端語音是實驗性能力，很多瀏覽器沒有本機繁體中文語言包。本機加密也無法防止惡意程式、已解鎖裝置、惡意網站更新或使用者分享後的副本。

## 測試與實際證據

```sh
npm run check        # 語法、import 與靜態不變條件
npm test             # Node 內建測試：資料、加密、匯出、日期、伺服器
npm run test:ui      # Playwright 隔離 DOM 介面測試；不是完整 E2E
npm run test:browser # 真實網址 E2E；需本機瀏覽器能開啟 localhost
npm run verify      # check + test + build + test:ui
npm run verify:release # 另加真實網址 E2E；受阻或失敗均不得視為 release 通過
```

Python 瀏覽器測試需要 Playwright（測試版本見 `tests/requirements.txt`）：

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
```

本次 **53 項 Node 測試、31 項隔離 DOM 介面檢查通過**。環境 Chromium 管理政策封鎖所有網址，真實網址 E2E 在載入 localhost 前被阻擋，沒有改動政策；因此**不能據此宣稱已驗證瀏覽器 IndexedDB 持久化、多分頁交易、離線重新啟動或加密還原的整條流程**。已提供無 mock 的 E2E 腳本供允許本機測試的環境執行。也尚未做真正 VoiceOver、TalkBack、點字顯示器或目標使用者測試。

[測試報告](docs/TEST_REPORT.md) 與 `evidence/` 保留結果；不要只看總數。`ui_test.py` 明確使用 `about:blank` 隔離測試架構，只測元件互動、不測來源／CSP／儲存／PWA。

## 專案導覽

- `src/`：原生 ES modules、語意 DOM、CSS；所有健康邏輯在本機。
- `dist/`：已建置的部署檔；`scripts/build.mjs` 產生固定版本的靜態殼快取。
- `docs/REQUIREMENTS.md`：103 項本對話需求逐項對照與實作／限制／後續工作。
- `docs/conversation/KEY_INFORMATION.md`：原討論重點、範例與數字台帳；不是平台逐字匯出。
- `docs/research/2026-09-06.md`：35 組查核過的官方與研究來源、採用理由與限制。
- `docs/ARCHITECTURE.md`、`THREAT_MODEL.md`、`MEDICAL_BOUNDARIES.md`：不可破壞的資料與產品邊界。
- `docs/CODE_MAP.md`：模組入口與本版行號，後續改動需重新產生。
- `prompts/CONTINUE.zh-TW.md`：可以直接交給 Claude Code 的接續開發任務。
- `CLAUDE.md`、`.claude/rules/`、`.claude/skills/verify-release/`：簡短總則、按路徑載入的規則與手動驗證工作流。

## 使用 Claude Code 接續

在本專案根目錄啟動，先規劃：

```sh
claude --permission-mode plan
```

貼上 `prompts/CONTINUE.zh-TW.md`，或輸入：

```text
請閱讀 @prompts/CONTINUE.zh-TW.md 並依照其中步驟規劃。先完成真實網址的加密、持久化、離線與多分頁驗證，再決定最小修補；目前不要部署，也不要讀取任何真實健康備份或密語。
```

審閱計畫後才允許實作；`/verify-release` 是本專案提供的手動技能。它不會自動上傳、部署或把未執行的測試寫成通過。CLAUDE.md 是工作指引，不是安全隔離邊界；權限仍由 Claude Code 與你的環境管理。

## 授權

程式採 MIT，見 `LICENSE`。研究文件只整理觀點與來源，沒有打包第三方論文全文或字型。任何真實健康資料都不應提交到 Git、測試紀錄或 AI 工具。
