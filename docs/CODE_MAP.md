# 程式入口與行號索引

快照：0.1.0 / 2026-09-06。行號僅適用這份交付檔案；後續修改後以檔案內容與搜尋符號為準。先閱讀 ARCHITECTURE.md，不要直接修改 dist。零 runtime 相依套件，並非沒有測試或部署環境需求。

| 模組 | 行數 | 主要入口（本版行號） |
|---|---:|---|
| `src/app.js` | 165 | `App` L15 |
| `src/components/editor.js` | 123 | `editorPage` L6 |
| `src/components/home.js` | 46 | `homePage` L5；`journalPage` L33 |
| `src/components/insights.js` | 20 | `insightsPage` L4 |
| `src/components/safety.js` | 13 | `safetyPage` L2 |
| `src/components/settings.js` | 44 | `htmlEscape` L4；`htmlReport` L5；`settingsPage` L9；`dataPage` L28 |
| `src/domain/analysis.js` | 48 | `cycleAnalysis` L4；`observation` L20；`symptomPatterns` L29 |
| `src/domain/dates.js` | 33 | `today` L2；`validDate` L5；`epochDay` L12；`daysBetween` L16；`addDays` L17；`dateLabel` L20；`originFor` L24；`recordedMeta` L29 |
| `src/domain/demo.js` | 15 | `demoData` L3 |
| `src/domain/export.js` | 42 | `cell` L3；`selectedRecords` L4；`reportRows` L6；`csvReport` L30；`textReport` L31；`reminderCalendar` L35；`downloadFile` L39 |
| `src/domain/model.js` | 98 | `emptyData` L12；`newRecord` L15；`newSymptom` L20；`mutateRecord` L21；`capture` L41；`undoRecord` L46；`assert` L54；`plain` L55；`keys` L56；`str` L57；`option` L58；`num` L59；`timestamp` L60；`validateMeta` L61；`validateCore` L64；`validateData` L80；`recordSummary` L91 |
| `src/domain/reminders.js` | 10 | `reminderDue` L2 |
| `src/lib/crypto.js` | 39 | `base64` L5；`unbase64` L8；`validateEnvelope` L12；`deriveKey` L17；`seal` L22；`unseal` L30 |
| `src/lib/dom.js` | 48 | `el` L2；`field` L17；`select` L22；`checkbox` L27；`heading` L31；`card` L32；`details` L33；`announce` L34；`focusMain` L39；`modal` L41 |
| `src/lib/speech.js` | 22 | `localSpeechSupport` L2；`localSpeechStatus` L8；`startLocalDictation` L12 |
| `src/lib/storage.js` | 78 | `openDB` L4；`readEnvelope` L13；`compareWrite` L23；`Vault` L37 |
| `scripts/build.mjs` | 14 | `walk` L8 |
| `scripts/check.mjs` | 9 | `walk` L6 |
| `scripts/serve.mjs` | 22 | 模組／測試入口見檔案 |
| `scripts/ui-test-bundle.mjs` | 13 | `walk` L8 |
| `tests/unit/crypto.test.mjs` | 21 | 模組／測試入口見檔案 |
| `tests/unit/domain.test.mjs` | 45 | `intervals` L32 |
| `tests/unit/speech.test.mjs` | 6 | 模組／測試入口見檔案 |
| `tests/unit/static.test.mjs` | 15 | 模組／測試入口見檔案 |
| `tests/e2e/browser_test.py` | 53 | `passed` L13；`unlock` L14 |
| `tests/e2e/ui_test.py` | 115 | `record` L16；`assert_` L20；`duplicate_ids` L23 |

## 修改路徑

快記流程：home → capture/updateRecord → Vault.update → seal → compareWrite。補登：editor queue/drain → mergeRecordPatch → 各欄位 provenance。模式：cycleAnalysis、observation、symptomPatterns → insights。分享：reportRows → textReport/csvReport，HTML 由 settings 元件轉義生成。完整備份與還原：Vault.backup/restore。

服務端只有本機靜態檔案伺服器，不處理健康 API。build 產生公開資產與靜態 Service Worker；ui-test-bundle 只供隔離 DOM 測試，不在 dist。單元測試不是完整 browser IDB 測試。browser_test.py 是真實 origin 測試，不得用 ui_test.py 取代。
