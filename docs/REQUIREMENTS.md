# 本對話需求追溯表

本版：0.1.0，日期：2026-09-06，共 **103 項**。U1 是視障女性症狀／週期設計的提問，A1 是第一份完整回覆；U2 是疲倦導致難以紀錄的提問，A2 是第二份回覆；U3 是建立專案的本次要求。原句與數字重點整理在 conversation/KEY_INFORMATION.md。

「已實作」表示有真實程式路徑，**不是宣稱所有平台、資安、臨床或使用者驗收通過**。測試欄區分已執行 Node／DOM 與尚未完成的真實 origin E2E。所有 src 路徑以下省略 src/ 前綴。原先提議超出純前端能力或缺乏效度的項目不偷偷刪除：列為有限、後續、排除或待驗。


## A. 定位、資料意義與症狀

| ID／來源 | 要求 | 狀態 | 位置 | 驗證／限制 |
|---|---|---|---|---|
| QD-001 · U1/A1 | 不是靠不舒服猜經期；出血與症狀分開 | 已實作 | `domain/model.js; domain/analysis.js` | Node |
| QD-002 · A1/A2 | 未填、未問、不確定、明確沒有、出現分離 | 已實作 | `domain/model.js; domain/analysis.js` | Node + DOM |
| QD-003 · A1 | 出血五態，不要求視覺、顏色或照片 | 已實作 | `components/editor.js` | DOM 部分；人工待驗 |
| QD-004 · A1 | 只有使用者確認出血與開始，才能成為週期錨點 | 已實作 | `domain/model.js; domain/analysis.js` | Node + DOM |
| QD-005 · A1 | 流量、漏出、用品更換可選；不是精確失血量 | 已實作 | `components/editor.js` | 原始碼；人工待驗 |
| QD-006 · A1 | 頭痛、疲倦、睡眠、腹部、GI、情緒、專注、其他 | 已實作 | `domain/model.js; components/editor.js` | Node + DOM |
| QD-007 · A1 | 頭痛時間、影響、持續、位置、伴隨症狀 | 有限 | `components/editor.js` | 每日摘要；非一天多場事件 |
| QD-008 · A1 | 腸胃與腹部疼痛不得混成同一項 | 已實作 | `domain/model.js` | Node |
| QD-009 · A1 | 功能影響四級與不確定，不用強制 1–10 滑桿 | 已實作 | `components/editor.js` | DOM |
| QD-010 · A1 | 睡眠、壓力、疾病、藥物改變選填 | 已實作 | `domain/model.js; components/editor.js` | Node；人工待驗 |
| QD-011 · A1 | 休息、處置、效果等選填背景 | 有限 | `components/editor.js` | 文字＋效果選項；非結構化用藥系統 |
| QD-012 · A1 | GI 子類／疼痛位置／伴隨狀況可補充 | 有限 | `components/editor.js` | 自由文字，非專屬臨床量表 |
| QD-013 · A1 | 更正過去出血日期，重新計算 | 已實作 | `domain/model.js; app.js` | Node + DOM 部分 |
| QD-014 · A1/A2 | 不以未開 App 推定 fatigue/PMS | 已實作 | `domain/analysis.js` | Node；無使用遙測 |
| QD-015 · A1 | 雙時間軸、四類資訊的可理解紀錄 | 已實作 | `components/insights.js; domain/export.js` | 文字與表格；非視覺圖表 |

## B. 低能量紀錄與補登

| ID／來源 | 要求 | 狀態 | 位置 | 驗證／限制 |
|---|---|---|---|---|
| QD-016 · U2/A2 | Capture → Enrich → Verify | 已實作 | `components/home.js; components/editor.js` | DOM |
| QD-017 · A2 | 解鎖後一個動作留下有不適記號 | 已實作 | `components/home.js` | DOM；真人秒數未測 |
| QD-018 · A2 | 沒有不適、不確定、先略過皆有效 | 已實作 | `domain/model.js; components/home.js` | Node + DOM |
| QD-019 · A2 | 不想分類也能完成，不強迫文字或原因 | 已實作 | `components/home.js` | DOM |
| QD-020 · A2 | 前兩題優先活動影響與大約時間 | 已實作 | `components/editor.js` | DOM |
| QD-021 · A2 | 每步保存、可復原，錯誤保留最新輸入 | 已實作 | `components/editor.js; lib/storage.js` | Node + DOM；真實 IDB 待驗 |
| QD-022 · A2 | 離頁先完成寫入，不蓋掉更晚編輯 | 已實作 | `app.js; components/editor.js` | DOM |
| QD-023 · A2 | 待補充不是欠交，不批量責備漏記 | 已實作 | `components/home.js` | 原始碼 + DOM |
| QD-024 · A2 | 補昨天入口，不必找月曆 | 已實作 | `components/home.js` | DOM |
| QD-025 · A2 | 依日期一次補一天，允許不確定 | 已實作 | `components/editor.js` | DOM |
| QD-026 · A2 | 確認開始後中立回顧最近 1–3 天 | 已實作 | `components/home.js` | DOM |
| QD-027 · A2 | 可關閉開始後回顧 | 已實作 | `components/settings.js` | 原始碼；人工待驗 |
| QD-028 · A2 | 發生日期和實際輸入時間分開 | 已實作 | `domain/model.js` | Node |
| QD-029 · A2 | 每欄位當日／隔日／更晚來源與開始後回顧 | 已實作 | `domain/model.js` | Node + DOM |
| QD-030 · A2 | 時間精確度、確定程度、部分狀態、確認 | 已實作 | `components/editor.js; domain/model.js` | Node + DOM 部分 |
| QD-031 · A2 | 修正歷史不是靜默覆寫 | 已實作 | `domain/model.js` | Node；不是不可竄改臨床 audit |
| QD-032 · A2 | 2 操作、5–10 秒最低紀錄 | 待使用者驗證 | `docs/ACCESSIBILITY_ACCEPTANCE.md` | 僅解鎖後目標；非測得結果 |
| QD-033 · A2 | 同一天可多次獨立症狀事件 | 後續 | `docs/ROADMAP.md` | 目前每日摘要＋修正歷史 |
| QD-034 · A2 | 只記得一段日期範圍的補登 | 後續 | `docs/ROADMAP.md` | 目前需選一天，可標不確定 |
| QD-035 · A2 | 自動挑最有資訊題目的 JITA-EMA | 後續／需驗證 | `docs/ROADMAP.md` | 目前由使用者選症狀，非自適應量測 |

## C. 描述、模式與醫療邊界

| ID／來源 | 要求 | 狀態 | 位置 | 驗證／限制 |
|---|---|---|---|---|
| QD-036 · A1 | 預估範圍而非唯一到來日期 | 已實作 | `domain/analysis.js` | Node |
| QD-037 · A1 | 資料不足、漏記、差異大就暫停 | 已實作 | `domain/analysis.js` | Node |
| QD-038 · A1 | 只用個人已確認區間，不預設 28 天 | 已實作 | `domain/analysis.js` | Node |
| QD-039 · A1 | 顯示方法與資料量，避免假高／中信心 | 已實作並修正原建議 | `components/insights.js` | Node + DOM |
| QD-040 · A1 | 每類症狀獨立比較經前與其他日 | 已實作 | `domain/analysis.js` | Node |
| QD-041 · A1/A2 | 觀察分母、缺失、回憶數透明 | 已實作 | `domain/analysis.js; components/insights.js` | Node |
| QD-042 · A1 | 睡眠／壓力／用藥作為可能背景，不斷言因果 | 有限 | `components/editor.js; domain/analysis.js` | 能記；未做統計混淆校正 |
| QD-043 · A1/A2 | 不診斷 PMS/PMDD、不宣告經期偏頭痛 | 已實作邊界 | `components/safety.js; docs/MEDICAL_BOUNDARIES.md` | 原始碼與文案 |
| QD-044 · A2 | 個人簡化日誌與正式量表不混用 | 已實作邊界 | `docs/MEDICAL_BOUNDARIES.md` | 本版只有個人模式 |
| QD-045 · A2 | 正式 DRSP 內容、順序、回憶期與計分原樣有效 | 後續／臨床合作 | `docs/ROADMAP.md` | 沒有偽造臨床模式按鈕 |
| QD-046 · A1 | 新劇烈頭痛、出血、腹痛與精神危機安全資訊 | 已實作 | `components/safety.js` | DOM；臨床文案待專業審閱 |
| QD-047 · A1/A2 | 未解鎖／存檔失敗也可求助 | 已實作 | `app.js; components/editor.js` | DOM |
| QD-048 · A1 | 提供醫療分享摘要與來源限制 | 已實作 | `domain/export.js` | Node + DOM |
| QD-049 · A1 | 不做排卵、安全期、生育／懷孕推論 | 排除 | `docs/MEDICAL_BOUNDARIES.md` | 無此功能 |

## D. 視障、低視能與尊重

| ID／來源 | 要求 | 狀態 | 位置 | 驗證／限制 |
|---|---|---|---|---|
| QD-050 · A1/A2 | 線性導覽；日曆不是唯一入口 | 已實作 | `app.js; components/home.js` | DOM |
| QD-051 · A1/A2 | 控制有名稱、角色、狀態與讀屏可及資訊 | 已實作待完整驗收 | `lib/dom.js; components/*.js` | DOM 部分；VoiceOver/TalkBack 待測 |
| QD-052 · A1/A2 | 狀態與錯誤可朗讀、焦點合理 | 已實作待完整驗收 | `lib/dom.js; app.js` | DOM 焦點；真讀屏待測 |
| QD-053 · A1 | 所有模式都有文字等價資訊 | 已實作 | `components/insights.js` | DOM |
| QD-054 · A1/A2 | 大字、高對比、小螢幕重排 | 已實作 | `styles.css; components/settings.js` | 320 CSS px DOM；實機待測 |
| QD-055 · A1/A2 | 鍵盤、不只拖曳／長按、避免滑桿負擔 | 已實作待完整驗收 | `components/*.js` | 原生控制；人工全流程待測 |
| QD-056 · A1 | 點字顯示器可用性 | 待實機驗證 | `docs/ACCESSIBILITY_ACCEPTANCE.md` | 沒有宣稱已驗證 |
| QD-057 · A1/A2 | 震動不是唯一回饋 | 已實作邊界 | `lib/dom.js` | 本版不使用震動 |
| QD-058 · A1 | 符合 WCAG 2.2 AA | 目標／未認證 | `docs/ACCESSIBILITY_ACCEPTANCE.md` | 沒有完整稽核證書 |
| QD-059 · A1/A2 | 不幼兒化、不羞辱、不預設情緒就是 PMS | 已實作文案 | `components/*.js` | 仍需共創確認 |
| QD-060 · A1/A2 | 無打卡、紅色欠交或失去徽章懲罰 | 已實作邊界 | `components/home.js` | 原始碼 |
| QD-061 · A1 | 稱呼可自訂，無強制粉紅／生育意象 | 已實作 | `components/settings.js; styles.css` | DOM；醫療頁保留準確稱呼 |
| QD-062 · A1 | 不預設性別認同、婚育或照顧者共享 | 已實作邊界 | `components/*.js` | 無人口或伴侶必填 |
| QD-063 · A1/A2 | 版本更動後無障礙回歸 | 已提供流程 | `tests/e2e; docs/ACCESSIBILITY_ACCEPTANCE.md` | 自動部分＋待人工 |

## E. 隱私、保管與平台

| ID／來源 | 要求 | 狀態 | 位置 | 驗證／限制 |
|---|---|---|---|---|
| QD-064 · A1 | 核心功能免帳號 | 已實作 | `app.js` | demo DOM；真日誌 E2E 待驗 |
| QD-065 · A1 | 資料本機優先，無伺服器健康儲存 | 已實作 | `lib/storage.js` | Node 架構檢查；瀏覽器 E2E 待驗 |
| QD-066 · A1 | 先加密再持久保存，解鎖密鑰只在記憶體 | 已實作待專業審閱 | `lib/crypto.js; lib/storage.js` | Node crypto；browser 待驗 |
| QD-067 · A1 | 獨立鎖定、背景隱私遮罩 | 已實作待實機驗收 | `app.js` | 原始碼；真實背景切換待驗 |
| QD-068 · A1 | 完整加密備份、驗證後還原 | 已實作待整合驗收 | `lib/storage.js; app.js` | Node crypto；下載還原 E2E blocked |
| QD-069 · A1 | 多分頁不得覆寫他人最新版本 | 已實作待整合驗收 | `lib/storage.js` | CAS 原始碼；真實 IDB E2E blocked |
| QD-070 · A1 | 日期／欄位可選明文 TXT CSV HTML | 已實作 | `domain/export.js; components/settings.js` | Node + DOM |
| QD-071 · A1 | 備註與背景預設不分享 | 已實作 | `components/settings.js; domain/export.js` | Node + DOM |
| QD-072 · A1 | 單筆與全部刪除，包括本機來源與歷史 | 已實作待整合驗收 | `domain/model.js; lib/storage.js; app.js` | Node 部分；IDB E2E blocked |
| QD-073 · A1 | 衍生模式可重新計算／刪除，不另存秘密分析 | 已實作 | `domain/analysis.js` | 純函式；無服務端模型 |
| QD-074 · A1 | 外部副本也能遠端完整刪除 | 不可承諾 | `docs/THREAT_MODEL.md` | 已下載備份／匯出／行事曆由使用者管理 |
| QD-075 · A1 | 雲端 E2EE 同步 | 後續 | `docs/ROADMAP.md` | 本版沒有任何同步服務 |
| QD-076 · A1 | 不放廣告、session replay、分析 SDK、遠端模型 | 已實作邊界 | `src; scripts/check.mjs` | 靜態檢查；真實網路待驗 |
| QD-077 · A1 | 不蒐集 GPS、通訊錄、廣告 ID | 已實作邊界 | `src` | 無相關權限或 API |
| QD-078 · A1 | 不要求性生活、懷孕意願、流產等資訊 | 已實作邊界 | `components/*.js` | 無此表單 |
| QD-079 · A1 | 研究捐贈、行銷、分享分別同意 | 部分／後續 | `components/settings.js; docs/ROADMAP.md` | 只有自主明文分享；沒有研究或行銷上傳 |
| QD-080 · A1 | 不把敏感內容寫入 crash log | 已實作設計 | `src; tests` | 無 crash SDK；仍需主機審查 |
| QD-081 · A1 | 個資法律合規 | 需外部審閱 | `docs/THREAT_MODEL.md` | 未宣稱台灣／GDPR／HIPAA 認證 |
| QD-082 · A1 | 可及 PDF 匯出 | 後續 | `docs/ROADMAP.md` | 已有 HTML/TXT/CSV；未產生標記 PDF |
| QD-083 · A1 | QR、經期用品音訊、影像辨識 | 後續／排除核心 | `docs/ROADMAP.md` | 無攝影要求、無私密圖像處理 |

## F. 提醒、語音與整合

| ID／來源 | 要求 | 狀態 | 位置 | 驗證／限制 |
|---|---|---|---|---|
| QD-084 · A2 | 選配提醒時間，可關閉、不加重症狀期負擔 | 已實作 | `domain/reminders.js; components/settings.js` | Node |
| QD-085 · A2 | 一天一次／隔天、延後 2 小時、暫停 7 天 | 已實作 | `domain/reminders.js` | Node；頁面開啟且解鎖時 |
| QD-086 · A2 | 所有原先提出的今晚／明天／起床等提醒選項 | 部分 | `components/settings.js; docs/ROADMAP.md` | 已有自訂時刻、延後與暫停；事件錨點後續 |
| QD-087 · A1/A2 | 鎖定畫面中性通知／快速動作 | 平台限制／替代 | `domain/export.js; docs/DEPLOYMENT.md` | 沒有系統推播；中性 ICS 可自行匯入 |
| QD-088 · A1/A2 | 關閉網頁後仍可靠定時提醒 | 未實作／不可假裝 | `docs/DEPLOYMENT.md` | 需其他平台能力或推播服務 |
| QD-089 · A2 | 主畫面捷徑／PWA | 有限 | `public/manifest.webmanifest; scripts/build.mjs` | PWA 殼；安裝與離線實機待測 |
| QD-090 · A1/A2 | 按下才語音輸入、不持續收音 | 條件式實作 | `lib/speech.js; components/editor.js` | 能力偵測測試；實際語音待驗 |
| QD-091 · A1/A2 | 裝置端 zh-TW，不外送、不存原音 | 條件式實作 | `lib/speech.js` | 不支援就禁用，無雲端 fallback |
| QD-092 · A1/A2 | 辨識內容先確認，可取消再寫入 | 已實作待實機驗收 | `components/editor.js` | 只加入備註；不自動解析出血 |
| QD-093 · A1 | 耳機限定與外接喇叭精準路由控制 | 不可跨瀏覽器保證 | `docs/THREAT_MODEL.md` | 不自動 TTS；使用者控制讀屏聲音 |
| QD-094 · A2 | 手錶、原生 Shortcuts/App Intents／通知回覆 | 後續 | `docs/ROADMAP.md` | 純 PWA 不冒稱原生整合 |
| QD-095 · A2 | 睡眠、活動、心率、用藥被動資料 | 後續 | `docs/ROADMAP.md` | 目前手動背景；未取得平台健康資料 |
| QD-096 · A2 | 被動資料只作背景，不判定疲倦／月經 | 已實作邊界 | `domain/analysis.js` | 根本不以被動訊號推論 |

## G. 交付、研究與驗收

| ID／來源 | 要求 | 狀態 | 位置 | 驗證／限制 |
|---|---|---|---|---|
| QD-097 · U3 | 提供完整專案與可部署 dist | 已交付 | `README.md; dist` | build + ZIP 完整性 |
| QD-098 · U3 | 截至 2026-09-06 官方／原始研究查核 | 已交付 | `docs/research` | 35 組來源，區分年代與效度 |
| QD-099 · U3 | 前兩答所有重要需求與數字可追溯 | 已交付 | `docs/conversation/KEY_INFORMATION.md` | 重點／數字台帳；非平台逐字匯出 |
| QD-100 · U3 | Claude Code 官方風格接續 prompt | 已交付 | `CLAUDE.md; .claude; prompts` | 官方 schema／文件查核；未執行 Claude Code |
| QD-101 · A1/A2 | 至少跨 2–3 個週期共創試用 | 待進行 | `docs/ACCESSIBILITY_ACCEPTANCE.md` | 沒有捏造參與者與成效 |
| QD-102 · A1/A2 | 負擔、獨立操作、補登、洩露與尊重感評估 | 已規劃待執行 | `docs/ACCESSIBILITY_ACCEPTANCE.md` | 不預設蒐集遙測 |
| QD-103 · U3 | 測試真實、成功／blocked 不混寫 | 已交付 | `docs/TEST_REPORT.md; evidence` | 53 Node / 31 DOM；origin E2E blocked |
