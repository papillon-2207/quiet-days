# 部署、備份與更新

查核日期：2026-09-06。部署物是純靜態網站，不需要 API key、資料庫伺服器、帳號服務或 npm runtime 套件。本交付提供檔案，**沒有代為發布公開網址**。

## 本機

安裝 Node.js 22 以上（本次實測 22.16.0），在專案根目錄執行：

```sh
npm run dev
# http://127.0.0.1:4173/
```

不必 npm install。開發伺服器只允許應用程式資產；不公開 .claude、prompts、docs、備份或任意檔案。不開放區域網路，不能直接從手機存取這個位址。手機驗收請使用你控制的 HTTPS 測試部署。

```sh
npm run check
npm test
npm run build
npm run preview
```

開發模式不啟用 Service Worker；preview 使用 dist，才啟用靜態殼快取。曾在相同 origin 測過 PWA 而切回 dev 時，先備份，再在開發者工具註銷該站 Service Worker；不要順便清除 IndexedDB。

不能直接雙擊 index.html 使用 file://：ES modules、origin 儲存及相關 API 需要正確的網頁執行環境。[R15–R18]

## 正式靜態部署

把 **dist 內的全部檔案** 發布到自己的 HTTPS 靜態主機；不是把 src 單獨丟上去，也不是發布整個 repository。專案附 netlify.toml 及 dist/_headers；其主機語法依 R34。其他主機須自行設定相同 HTTP headers；_headers 並非所有服務通用。

必要條件：HTML 回傳 text/html，.js 回傳 JavaScript MIME，.webmanifest 為 manifest+json；所有資產同源且允許相對路徑；瀏覽器可用 IndexedDB、Web Crypto；Service Worker 在安全環境且允許註冊。不要讓未找到的 .js 回傳 index.html。

應用使用 hash 導覽，無需伺服器端 SPA rewrite。子路徑以斜線結尾，例如 /quiet-days/。公開入口只需 index.html、src/、public/、sw.js；_headers 供主機解析。不要把 tests、prompts、.claude 或真實備份上傳。

### Headers

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
```

HTML 有 CSP meta 後備，但 frame-ancestors 必須由 HTTP header 生效，不能只依靠 meta。不要為了消除錯誤而加入 unsafe-inline 或第三方 script。主機插入的分析工具、session replay、客服 widget 都可能破壞隱私模型。HSTS、TLS、存取紀錄保留由主機管理；本專案未審查你的主機。[R35]

sw.js 和 index.html 建議重新驗證、不長期 immutable cache；版本化 Service Worker 已在建置時產生內容雜湊。不要自行添加 skipWaiting，避免編輯途中換版。新版本需等舊頁面全部關閉，再重開。更新流程仍需真實瀏覽器驗收。[R19]

## 資料在哪裡

日誌綁定 **origin = scheme + hostname + port**。127.0.0.1 與 localhost、HTTP 與 HTTPS、不同 port、不同網域是不同資料位置。路徑不同不是另一位使用者的隔離邊界；同源其他 script 能接觸同源儲存。建議以專用 origin 承載單一日誌應用。

瀏覽器只持久保存加密 envelope。解鎖後的明文與密鑰在頁面記憶體。沒有雲端副本或密語重設；密語遺失無法恢復。私密瀏覽、作業系統清理、儲存驅逐、更換裝置或刪除網站資料都可能造成永久資料損失。可在「我的資料」要求 persistent storage，但瀏覽器可以拒絕，這不能替代備份。[R16–R18]

## 備份與跨裝置

在「我的資料」下載 .qdays 並保存到自己信任的位置。它包括設定、原始紀錄、來源與修正歷史。還原需原密語。搬站前先備份；在新站選還原、輸入原密語，再核對日期與備註。舊站不會自動刪除，請自行處理。

TXT、CSV、HTML 是**明文分享檔**，與加密備份不同。預設不含自由備註與生活情境，仍含所選日期的敏感資訊。分享後的副本、列印、截圖、行事曆事件無法由 App 遠端撤回。

`.ics` 使用中性文字，但行事曆提供者可能同步事件；App 刪除不會刪除外部行事曆。原生背景通知、Web Push 伺服器不在本版。[R20]

## 上線前人工檢查

1. 跑 npm run verify:release；blocked、failed 都不是通過。確認該次 evidence 是當前 commit。
2. 實機 Chrome/Android、Safari/iOS 進行新建、補登、重新載入、備份、刪除、還原；所有資料只用虛構內容。
3. 開離線後重新載入，再重開安裝的 PWA，確認記錄與解鎖；檢查更新未打斷編輯。
4. 檢查網路只下載第一方資產；匯出和逐頁操作不外送健康資訊。
5. 使用 VoiceOver/TalkBack 完成 docs/ACCESSIBILITY_ACCEPTANCE.md，不以自動工具取代。
6. 真實使用者試用前，完成隱私告知、臨床文案、資料安全專業審查。

本版附部署設定，不等於已在各供應商完成實測。
