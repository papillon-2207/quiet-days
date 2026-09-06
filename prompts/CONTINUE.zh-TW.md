# Claude Code 接續開發任務：留白 Quiet Days

請在本 repository 工作，先規劃，不要從零重寫，也不要直接部署。

## 產品與交付現況

這是視障／低視能使用者的低負擔身體與週期日誌：Capture → Enrich → Verify。當下先留最小記號，稍後補症狀，保留回憶來源；不預設頭痛、疲倦、腹瀉就是 PMS。使用者自主、可跳過、沒有羞辱式打卡。純前端、無 runtime npm 套件；所有健康資料以本機加密 envelope 持久保存。

請先讀 @CLAUDE.md、@docs/TEST_REPORT.md、@docs/ARCHITECTURE.md、@docs/THREAT_MODEL.md、@docs/MEDICAL_BOUNDARIES.md、@docs/REQUIREMENTS.md。需要追溯舊討論才讀 @docs/conversation/KEY_INFORMATION.md。用 @docs/CODE_MAP.md 定位但以實際行號為準。

已有 53 項 Node 測試、31 項隔離 DOM 檢查；交付環境的真實 localhost E2E 因管理政策封鎖而未完成。不能據此宣稱瀏覽器儲存、加密、離線、多分頁與還原的整合流程已通過。你的首要任務是補足這段證據，不是增加炫目的功能。

## 第一階段：探索與計畫（取得批准前不改檔）

1. 確認環境 Node、Python、Playwright 與瀏覽器；辨識是否允許測試 localhost。不要變更或繞過瀏覽器管理政策。
2. 檢視 tests/e2e/browser_test.py、src/lib/storage.js、src/lib/crypto.js、src/components/editor.js、src/app.js、scripts/build.mjs，追蹤每條真實流程；不使用真實健康資料或密語。
3. 提出最小驗證計畫，包含新建→快速記號→補登→自動儲存→重新載入→解鎖→備份→兩分頁衝突→離線重啟→刪除→還原→PWA 更新。列出檔名、測試與可觀察成功條件。
4. 列出工程決策與醫療建議的區別：本版的 3 個完整區間、±2 天、7 天描述窗口、15–90／14 天暫停門檻均不是臨床定義。
5. 等我批准計畫，再開始修改。可用官方文件查核必要 API，優先 MDN/W3C/平台官方；不能以其他 app 的行銷宣稱作為效度證據。

## 第二階段：批准後實作與驗證

先在允許的真實 origin 跑 npm run verify:release。若有失敗，先保留失敗證據，再加最小迴歸測試並修復根因；不要 mock 掉 IndexedDB、停用 CSP、略過 assertion 或把 blocked 改成 pass。修正保持 native ES modules，不引入 React/Vite/後端只是為了重寫風格。

特別檢查：
- 密語錯誤與毀損備份不影響舊資料；離線時仍可解鎖已安裝的殼。
- Web Crypto 不跨過 IDB transaction 的活動時限；CAS 拒絕 stale tab，不靜默覆寫。
- 快速切換、較早寫入失敗、較晚文字仍在輸入、背景鎖定，都不能蓋回舊草稿。真正斷電無法保證零遺失，文案要誠實。
- 同日補記不是即時；補昨天與開始出血後回顧有不同來源。不確定／未問／沒有症狀不可合併。
- 語音在不支援裝置端 zh-TW 時不可偷偷使用雲端。使用者確認前不新增症狀或出血。
- 自由文字只當純文字；明文匯出需選擇性、CSV 公式防護；日誌刪除不承諾刪除外部副本。
- 求助入口在未解鎖與儲存失敗時皆可操作；不能要求先填完問卷。
- Service Worker 不強制替換正在編輯的頁面，不快取健康明文。

## 第三階段：實機／使用者驗收準備

完成 @docs/ACCESSIBILITY_ACCEPTANCE.md 的可重現步驟；只有實際跑過的組合才標完成。加入實際 VoiceOver/TalkBack 手勢與讀出文字證據。5–10 秒是待驗證目標，不是既有成績；不以密碼保護退讓換秒數。未經同意不得上傳使用者資料或截圖。

只有完成上述 P0 後，才提議 @docs/ROADMAP.md 的 P1：同一天多事件、無法確定日期的範圍式回憶、常用症狀排序。先設計 migration 和 provenance，不把舊 daily summary 冒充新精確事件。正式臨床量表、原生穿戴、雲端同步、AI 診斷不在本次授權範圍。

## 最後交付格式

請回報實際修改的檔案／行號、修正原因、執行命令與 exit code、通過數、blocked/unrun 項目、人工驗證缺口。更新 docs 與 requirements 對照，重建 dist。保留可執行測試與虛構 fixtures。不要提交／push／部署／安裝付費服務，除非我另行批准；不要宣稱絕對無 bug、臨床有效或 WCAG 已認證。
