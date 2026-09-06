import {el,p,heading,card,button,field,select,checkbox,details,modal,announce} from '../lib/dom.js';
import {today,addDays,validDate} from '../domain/dates.js';
import {csvReport,textReport,downloadFile,reminderCalendar,reportRows} from '../domain/export.js';
function htmlEscape(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function htmlReport(data,options){
  const {header,rows}=reportRows(data,options);
  return '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'none\'"><title>個人日誌摘要</title></head><body><h1>個人日誌摘要</h1><p>使用者自行選擇的欄位。未填寫不代表無症狀；補登不等同前瞻性臨床量表；非診斷用途。</p><p>期間：'+htmlEscape(options.from)+' 至 '+htmlEscape(options.to)+'</p><table><caption>個人紀錄與來源</caption><thead><tr>'+header.map(s=>'<th scope="col">'+htmlEscape(s)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((s,i)=>i===0?'<th scope="row">'+htmlEscape(s)+'</th>':'<td>'+htmlEscape(s)+'</td>').join('')+'</tr>').join('')+'</tbody></table></body></html>';
}
export function settingsPage(app) {
  const data=app.vault.data,s=data.settings,root=el('div',{},heading('依你的節奏。','偏好設定也會加密留在這個裝置。','設定與隱私'));
  root.append(card('閱讀與操作',checkbox('低能量模式',s.lowEnergy,v=>app.setting('lowEnergy',v)),checkbox('更大的文字',s.largeText,async v=>{await app.setting('largeText',v);app.applyPreferences();}),checkbox('高對比',s.highContrast,async v=>{await app.setting('highContrast',v);app.applyPreferences();}),
    field('偏好的經期稱呼（最多 16 字）',el('input',{type:'text',value:s.word,maxlength:'16',autocomplete:'off',on:{change:async e=>{if(e.target.value.trim())await app.setting('word',e.target.value.trim());else {e.target.value=s.word;announce('稱呼不可空白。',true);}}}}),'例如月經、經期、生理期或週期。一般日誌採用這個稱呼；醫療說明與匯出保留固定用詞。')));
  root.append(card('離開時的隱私',checkbox('離開分頁時自動鎖定',s.lockOnHide,v=>app.setting('lockOnHide',v),'預設開啟。重新進入需密語；可使用密碼管理員與貼上。關閉後，這個已解鎖分頁可能被他人看到，請使用裝置鎖。'),
    p('程式不自行朗讀健康資料，以免和讀屏衝突或在外接喇叭洩露。螢幕閱讀器、系統鍵盤聽寫與裝置備份的隱私設定，仍由你的裝置控制。','hint')));
  const time=el('input',{type:'time',value:s.reminderTime,on:{change:e=>app.setting('reminderTime',e.target.value)}});
  root.append(card('可以略過的提醒',p('只在網頁已開啟、可見且已解鎖時顯示站內提醒。關閉網頁後，本版不承諾準時提醒，也不要求推播權限。','notice'),field('提醒時間（留白代表關閉）',time),select('頻率',{'1':'一天一次','2':'每兩天一次'},String(s.reminderDays),v=>app.setting('reminderDays',Number(v))),
    el('div',{class:'actions'},button('暫停七天',async()=>{await app.setting('reminderPausedUntil',addDays(today(),6));announce('站內提醒已暫停七天。');},'secondary'),button('關閉站內提醒',async()=>{await app.setting('reminderTime','');time.value='';announce('站內提醒已關閉。');},'text-button'),button('恢復站內提醒',async()=>{await app.setting('reminderPausedUntil','');announce('已取消暫停；請確認仍有設定時間。');},'text-button')),
    button('匯出中性行事曆提醒',()=>modal('交給你的行事曆提醒？',close=>[
      p('匯出的 .ics 只包含「私人提醒」，不含出血、症狀或預測。依設定時間與頻率，最多建立 30 次提醒。行事曆可能同步到你或他人的帳號；通知內容與準時程度由行事曆和系統決定。'),
      p('暫停或刪除本 App 不會移除已匯入的行事曆事件。請自行到行事曆移除；重複匯入可能產生重複提醒。','hint'),
      button('確認並匯出提醒',()=>{try{downloadFile(reminderCalendar({time:app.vault.data.settings.reminderTime,interval:app.vault.data.settings.reminderDays}),'private-reminder.ics','text/calendar;charset=utf-8');close();}catch(e){announce(e.message,true);}},'primary')]),'secondary')));
  root.append(card('週期與回顧',checkbox('開始出血後提供中立回顧',s.reviewAfterStart,v=>app.setting('reviewAfterStart',v)),checkbox('暫停週期範圍估計',s.pausePrediction,v=>app.setting('pausePrediction',v),'健康狀況、藥物、荷爾蒙使用或週期改變時，可以先暫停，不需提供原因。')));
  root.append(card('本機優先不代表永不遺失',p('瀏覽器可能清除資料；無痕模式、清除網站資料、更換手機或不同網址都可能讓紀錄不可用。請定期匯出加密備份，並妥善保留密語。忘記密語沒有雲端找回功能。'),
    button('向瀏覽器申請持續儲存',async()=>{try{const ok=await navigator.storage?.persist?.();announce(ok?'瀏覽器已允許持續儲存；仍需備份，使用者清除資料仍會刪除紀錄。':'瀏覽器未允許持續儲存，或不支援此功能。請定期備份。');}catch{announce('無法申請持續儲存，請定期備份。',true);}},'secondary'),button('前往備份與匯出',()=>app.navigate('data'),'text-button')));
  root.append(details('技術與隱私邊界',p('沒有帳號、伺服器資料庫、廣告、分析 SDK、第三方字型或生成式 AI 服務。資料使用 Web Crypto AES-GCM 加密後存入 IndexedDB；密鑰只保留在解鎖的記憶體中。'),p('本機加密不能防止已解鎖裝置、惡意擴充套件、遭入侵的瀏覽器、惡意網站更新或螢幕旁觀。主機仍可能記錄下載程式時的 IP 與一般存取記錄；沒有「完全匿名」保證。'),p('本版是個人記錄 MVP，未經臨床效度驗證、外部密碼學稽核或視障使用者實測，不宣稱 WCAG 認證、醫療器材核准或零風險。')));
  return root;
}
export function dataPage(app) {
  const data=app.vault.data, days=Object.keys(data.records).sort(),root=el('div',{},heading('資料，由你保管。','可以只分享需要的部分。沒有預設收件人，也不會自動傳送。','我的資料'));
  root.append(card('完整加密備份',p('包含全部紀錄、修正歷程與偏好。需要原密語才能還原。備份只下載到你選擇的位置；請檢查下載檔是否被瀏覽器或雲端資料夾同步。'),button('下載完整加密備份',async()=>{try{const raw=await app.vault.backup();downloadFile(raw,'private-journal.qdays','application/json');announce('已發起加密備份下載，請確認檔案保存成功。');}catch(e){announce(e.message,true);}},'primary'),button('匯入或還原加密備份',async()=>{await app.lock();app.authAction='restore';app.render(false);},'secondary')));
  const from=el('input',{type:'date',value:days[0] ?? today(),max:today(),required:true}),to=el('input',{type:'date',value:today(),max:today(),required:true});
  const fields={bleeding:true,symptoms:true,context:false,notes:false,provenance:true};let accepted=false;
  const section=card('選擇要分享的摘要',el('div',{class:'two-col'},field('起始日期',from),field('結束日期',to)),el('fieldset',{},el('legend',{},'包含的欄位'),...Object.entries({bleeding:'出血與已確認開始／結束',symptoms:'症狀與功能影響',context:'生活情境、藥物改變與措施',notes:'自由備註',provenance:'填寫來源、時間與確定程度'}).map(([k,label])=>checkbox(label,fields[k],v=>{fields[k]=v;}))),
    p('摘要會顯示每天的簡短填寫狀態與日期。未選欄位不會加入摘要或分析。修正前的完整內容只在加密備份，不在分享摘要。','hint'),checkbox('我知道以下摘要不是加密檔，分享前會檢查內容',false,v=>{accepted=v;}));
  function options(){if(!validDate(from.value)||!validDate(to.value)||from.value>to.value||to.value>today())throw new Error('請選擇正確的起訖日期（不晚於今天）。');return {from:from.value,to:to.value,fields};}
  function exportAs(format){try{const opts=options();if(!accepted)throw new Error('請先確認你了解摘要未加密。');
    if(format==='text')downloadFile(textReport(data,opts),'private-summary.txt');
    if(format==='csv')downloadFile(csvReport(data,opts),'private-summary.csv','text/csv;charset=utf-8');
    if(format==='html')downloadFile(htmlReport(data,opts),'private-summary.html','text/html;charset=utf-8');
    announce('已發起摘要下載；請檢查檔案與分享對象。');}catch(e){announce(e.message,true);}}
  section.append(el('div',{class:'actions'},button('先預覽文字摘要',()=>{try{const opts=options();modal('分享前再看一次',()=>[el('pre',{class:'report-preview',tabindex:'0','aria-label':'即將分享的文字摘要'},textReport(data,opts))]);}catch(e){announce(e.message,true);}},'secondary'),button('匯出純文字',()=>exportAs('text'),'secondary'),button('匯出 CSV',()=>exportAs('csv'),'secondary'),button('匯出無障礙 HTML',()=>exportAs('html'),'secondary')));
  root.append(section,card('刪除這個裝置的全部紀錄',p('刪除日誌、修正歷程與偏好，並移除本程式的離線快取。無法刪除你已下載的備份、分享摘要、行事曆事件或作業系統備份。這也不保證底層儲存媒體的不可恢復抹除。'),button('開始刪除全部資料',()=>app.confirmDelete(),'danger')));
  return root;
}
