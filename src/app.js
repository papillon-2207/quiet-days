import {Vault,readEnvelope} from './lib/storage.js';
import {MAX_BACKUP_BYTES} from './lib/crypto.js';
import {el,p,button,heading,card,field,checkbox,details,modal,announce,focusMain} from './lib/dom.js';
import {homePage,journalPage} from './components/home.js';
import {editorPage} from './components/editor.js';
import {insightsPage} from './components/insights.js';
import {settingsPage,dataPage} from './components/settings.js';
import {safetyPage} from './components/safety.js';
import {demoData} from './domain/demo.js';
import {emptyData,capture} from './domain/model.js';
import {today,addDays} from './domain/dates.js';
import {reminderDue} from './domain/reminders.js';

const ROUTES={today:'今天',journal:'日誌',insights:'個人模式',data:'我的資料',settings:'設定',help:'照顧與協助'};
class App {
  constructor(){this.vault=new Vault();this.route='today';this.selectedDay=today();this.editing=false;this.editOptions={};this.authAction='';this.existing=null;this.pending=0;this.dirty=false;this.flushEditor=null;this.cleanupEditor=null;this.stopSpeech=null;this.isLocking=false;this.reminderVisible=false;this.failedLock=false;}
  async init(){
    if(!window.isSecureContext || !crypto.subtle){document.getElementById('app').replaceChildren(card('需要安全連線',p('請以 HTTPS 網址，或 localhost 本機伺服器開啟。不能直接雙擊 HTML 檔案；加密功能無法在不安全環境啟動。')));return;}
    try{this.existing=await readEnvelope();}catch(e){announce(e.message,true);}
    this.route=ROUTES[location.hash.slice(1)]?location.hash.slice(1):'today';this.render(false);
    window.addEventListener('popstate',async()=>{const route=location.hash.slice(1);await this.navigate(ROUTES[route]?route:'today',false);});
    window.addEventListener('beforeunload',e=>{if(this.dirty||this.pending){e.preventDefault();e.returnValue='';}});
    document.addEventListener('visibilitychange',()=>{
      this.stopSpeech?.();this.stopSpeech=null;
      if(document.hidden && this.vault.data?.settings.lockOnHide)void this.lock(true);
      if(!document.hidden && this.failedLock)this.showFailedLock();
      if(!document.hidden)void this.checkReminder();
    });
    window.addEventListener('pagehide',()=>{this.stopSpeech?.();});
    window.addEventListener('pageshow',e=>{if(e.persisted)void this.lock(true);});
    window.addEventListener('online',()=>this.updateConnection());window.addEventListener('offline',()=>this.updateConnection());
    setInterval(()=>void this.checkReminder(),30000);
    if('serviceWorker' in navigator){
      // Only built distributions include sw.js. Source development intentionally has no worker.
      if(document.documentElement.dataset.built==='true'){
        try{const reg=await navigator.serviceWorker.register('./sw.js');reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',()=>{if(reg.waiting)announce('有新版可用。完成紀錄並關閉所有本程式分頁，下次開啟時更新。');});});}
        catch{announce('離線功能暫時無法啟用；已加密的紀錄仍保留在本機。');}
      }
    }
  }
  async commit(change,message='已儲存。',announceError=true){
    this.pending++;this.updateConnection();
    try{await this.vault.update(change);document.getElementById('alert').textContent='';if(message)announce(message);return true;}
    catch(e){announce(e.message,true);return false;}
    finally{this.pending--;this.updateConnection();}
  }
  async setting(key,value){return this.commit(d=>{d.settings[key]=value;return d;},'偏好已儲存。');}
  applyPreferences(){const s=this.vault.data?.settings;document.documentElement.classList.toggle('large-text',Boolean(s?.largeText));document.documentElement.classList.toggle('high-contrast',Boolean(s?.highContrast));}
  updateConnection(){const b=document.getElementById('connection');if(b)b.textContent=this.pending?'正在加密儲存':navigator.onLine?'本機優先':'離線使用中';}
  async navigate(route,history=true){
    // Safety information must never be gated by a failed or pending save.
    if(route==='help' && this.flushEditor){
      modal('照顧與協助',()=>{const page=safetyPage();page.querySelector('#page-title')?.removeAttribute('id');return [page];});return;
    }
    if(this.flushEditor && !await this.flushEditor()){announce('還有內容未儲存，請先重試，或複製內容後再離開。',true);return;}
    this.cleanupEditor?.();this.flushEditor=null;this.cleanupEditor=null;this.editing=false;this.route=route;
    if(history)window.history.pushState({},'',`#${route}`);
    this.render(true);
  }
  async edit(day,opts={}){
    if(this.flushEditor && !await this.flushEditor())return;
    this.cleanupEditor?.();this.flushEditor=null;this.cleanupEditor=null;this.selectedDay=day;this.editOptions=opts;this.editing=true;this.route='journal';window.history.pushState({},'','#journal');this.render(true);
  }
  async lock(automatic=false){
    if(this.isLocking)return;
    this.isLocking=true;this.stopSpeech?.();this.stopSpeech=null;
    if(automatic){document.getElementById('app').hidden=true;document.getElementById('privacy-screen').hidden=false;document.getElementById('status').textContent='';document.getElementById('alert').textContent='';}
    if(this.flushEditor && !await this.flushEditor()){
      this.failedLock=automatic;this.isLocking=false;
      if(!automatic)announce('內容尚未儲存；請先複製或重試，才不會遺失。',true);
      else if(!document.hidden)this.showFailedLock();
      return;
    }
    await this.vault.tail;this.cleanupEditor?.();this.cleanupEditor=null;this.flushEditor=null;this.dirty=false;this.vault.lock();this.editing=false;this.reminderVisible=false;
    document.querySelectorAll('dialog').forEach(d=>d.remove());
    try{this.existing=await readEnvelope();}catch{this.existing=null;}
    this.isLocking=false;this.failedLock=false;this.applyPreferences();this.render(false);
    document.getElementById('app').hidden=false;document.getElementById('privacy-screen').hidden=true;announce('已鎖定。');
  }
  showFailedLock(){
    document.getElementById('privacy-screen').replaceChildren(p('尚有未儲存的內容。為避免遺失，資料暫留在記憶體，畫面已遮蔽，但尚未完成鎖定。'),button('回到內容並處理儲存問題',()=>{this.failedLock=false;document.getElementById('privacy-screen').hidden=true;document.getElementById('app').hidden=false;announce('請複製尚未儲存的內容，或重試。',true);},'primary'),button('放棄未儲存內容並鎖定',async()=>{this.cleanupEditor?.();this.flushEditor=null;this.cleanupEditor=null;this.dirty=false;this.failedLock=false;await this.lock(true);},'danger'));
  }
  async confirmDelete(){
    const demo=this.vault.demo;const expected=demo?null:(this.vault.envelope ?? await readEnvelope());
    modal('永久刪除這個裝置的全部日誌？',close=>{
      const check=el('input',{type:'checkbox',id:'confirm-delete'});
      const form=el('form',{on:{submit:async e=>{
        e.preventDefault();if(!check.checked){announce('請先確認你知道刪除無法復原。',true);return;}
        try{
          if(this.vault.demo){this.vault.lock();}else await this.vault.deleteAll(expected);
          this.cleanupEditor?.();this.flushEditor=null;this.cleanupEditor=null;this.dirty=false;this.existing=demo?this.existing:await readEnvelope();this.editing=false;this.authAction='';
          if(!demo && 'caches' in window){for(const key of await caches.keys())if(key.startsWith('quiet-days-'))await caches.delete(key);}
          if(!demo && 'serviceWorker' in navigator){for(const reg of await navigator.serviceWorker.getRegistrations())if(reg.scope===new URL('./',location.href).href)await reg.unregister();}
          close();this.render(false);announce(demo?'體驗資料已清除；正式日誌未更動。':'本裝置日誌已刪除；已下載或分享的檔案與行事曆事件不會刪除。');
        }catch(error){announce(error.message,true);}
      }}},p('這會移除內容、歷程、偏好與此程式的快取。無法回復，也無法刪除你已下載、同步或分享的副本。'),el('label',{for:'confirm-delete',class:'delete-check'},check,' 我理解此刪除無法復原'),el('button',{type:'submit',class:'danger'},'確認永久刪除'));
      return [form];
    });
  }
  async checkReminder(){
    if(!this.vault.data || document.hidden || this.reminderVisible || !reminderDue(this.vault.data))return;
    if(this.editing)return;
    if(await this.commit(d=>{d.reminder={day:today(),snoozedUntil:''};return d;},'')){this.reminderVisible=true;this.render(false);}
  }
  reminder(){
    return el('section',{class:'reminder-banner','aria-label':'可略過的私人提醒'},p('有一項私人紀錄可以留下，現在或稍後都可以。'),el('div',{class:'actions'},button('快速標記',async()=>{if(await this.commit(d=>capture(d,today(),'marked'),'已留下簡短記號。')){this.reminderVisible=false;await this.navigate('today');}},'primary'),button('兩小時後再說',async()=>{await this.commit(d=>{d.reminder={day:today(),snoozedUntil:new Date(Date.now()+7200000).toISOString()};return d;},'只會在網頁仍開啟時再次提醒。');this.reminderVisible=false;this.render(false);},'secondary'),button('今天先略過提醒',()=>{this.reminderVisible=false;this.render(false);},'text-button')));
  }
  render(focus=false){
    const root=document.getElementById('app');this.applyPreferences();
    if(!this.vault.data){root.replaceChildren(this.auth());if(focus)focusMain();return;}
    const shell=el('div',{class:'app-shell'});
    const brand=el('div',{class:'brand'},el('span',{class:'brand-mark','aria-hidden':'true'},'◌'),el('div',{},el('strong',{},'留白'),p('給自己一點空間','brand-caption')));
    const nav=el('nav',{'aria-label':'主要導覽'},...Object.entries(ROUTES).map(([id,label])=>el('a',{href:`#${id}`,class:this.route===id?'active':'','aria-current':this.route===id?'page':null,on:{click:e=>{e.preventDefault();void this.navigate(id);}}},label)));
    shell.append(el('aside',{class:'sidebar'},brand,nav,el('div',{class:'sidebar-foot'},el('span',{id:'connection',class:'badge'},'本機優先'),p('沒有帳號，也沒有打卡任務。','hint'),button('鎖定日誌',()=>this.lock(),'secondary'))));
    const main=el('main',{id:'main',tabindex:'-1'});
    if(this.vault.demo)main.append(el('div',{class:'demo-banner'},p('體驗模式 · 內容不會永久保存。示範資料全為虛構，請勿輸入真實健康資訊。'),button('離開體驗',()=>this.lock(),'text-button')));
    if(this.reminderVisible)main.append(this.reminder());
    if(this.editing)main.append(editorPage(this,this.selectedDay,this.editOptions));
    else main.append(({today:homePage,journal:journalPage,insights:insightsPage,data:dataPage,settings:settingsPage,help:safetyPage}[this.route]??homePage)(this));
    // A preferred term is applied to diary text only, not medical instructions or exports.
    const term=this.vault.data.settings.word;
    if(term!=='經期' && !['settings','help'].includes(this.route)){
      const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);let node;
      while((node=walker.nextNode()))node.textContent=node.textContent.replaceAll('經期',term);
    }
    shell.append(main);root.replaceChildren(shell);this.updateConnection();
    if(focus){window.scrollTo({top:0,behavior:'instant'});focusMain();}
  }
  auth(){
    const panel=el('main',{id:'main',class:'auth-page',tabindex:'-1'});
    const intro=el('section',{class:'auth-intro'},el('div',{class:'brand'},el('span',{class:'brand-mark','aria-hidden':'true'},'◌'),el('strong',{},'留白')),p('PRIVATE BY DEFAULT','eyebrow'),heading('給身體，\n一點留白。','不舒服的日子，先留一個記號。等有餘力，再慢慢補充。'),el('div',{class:'intro-points'},p('不必填滿，才能理解自己。'),p('不知道，也是一種可以留下的答案。'),p('紀錄由你保管，不必向別人交代。')),p('為盲人與低視能者設計的個人身體日誌。\n不用帳號、不用看日曆，也不預設生育目標。','hint'));
    const section=el('section',{class:'auth-card','aria-label':'建立或開啟私人日誌'});
    if(this.authAction==='restore'){
      section.append(el('h2',{},'還原加密備份'),p('只接受本程式產生的 .qdays 加密備份。需要原密語；還原前會先驗證格式與解密。'),p(this.existing?'目前已有日誌。需明確同意覆寫；建議先取消並備份現有資料。':'此裝置尚無日誌。','hint'));
      const file=el('input',{type:'file',accept:'.qdays,application/json',required:true}),password=el('input',{type:'password',autocomplete:'current-password',required:true,minlength:'12',maxlength:'256'});let overwrite=false;
      const form=el('form',{on:{submit:async e=>{
        e.preventDefault();const f=file.files?.[0];if(!f)return;if(f.size>MAX_BACKUP_BYTES){announce('檔案超過 12 MiB 上限，未讀取或更動資料。',true);return;}if(this.existing&&!overwrite){announce('請先確認覆寫，或取消後備份原日誌。',true);return;}
        const submit=form.querySelector('button[type=submit]');submit.disabled=true;
        try{const pw=password.value;password.value='';await this.vault.restore(await f.text(),pw,this.existing);this.authAction='';this.route='today';this.render(true);announce('已還原並解鎖。');if(document.hidden)await this.lock(true);}catch(error){announce(error.message,true);submit.disabled=false;}
      }}},field('選擇加密備份',file),field('備份的原密語',password),checkbox('我已備份現有日誌，並同意覆寫',false,v=>{overwrite=v;}),el('button',{type:'submit',class:'primary'},'解密驗證並還原'));
      section.append(form,button('取消還原',()=>{this.authAction='';this.render(false);},'text-button'));
    }else{
      const exists=Boolean(this.existing);section.append(el('h2',{},exists?'開啟你的私人日誌':'建立只屬於你的日誌'),p(exists?'密語只用於這個裝置的解密，不會傳送給伺服器。':'先設定一次密語，之後用它解鎖。沒有姓名、信箱或電話欄位。'));
      const password=el('input',{type:'password',autocomplete:exists?'current-password':'new-password',required:true,minlength:'12',maxlength:'256',id:'vault-password'});
      const confirm=el('input',{type:'password',autocomplete:'new-password',required:true,minlength:'12',maxlength:'256',id:'vault-confirm'});
      let consent=exists;
      const form=el('form',{on:{submit:async e=>{
        e.preventDefault();if(!consent){announce('請先確認你了解密語無法找回。',true);return;}if(!exists && password.value!==confirm.value){announce('兩次密語不同，請再確認。',true);confirm.focus();return;}
        const submit=form.querySelector('button[type=submit]');submit.disabled=true;announce('正在處理本機加密，請稍候。');
        try{const pw=password.value;password.value='';confirm.value='';if(exists)await this.vault.unlock(pw);else await this.vault.create(pw);this.authAction='';this.route='today';this.render(false);document.getElementById('quick-marked')?.focus();announce(exists?'已解鎖。':'私人日誌已建立。');if(document.hidden)await this.lock(true);}
        catch(error){announce(error.message,true);submit.disabled=false;}
      }}},field(exists?'解鎖密語':'設定密語',password,'12–256 字元；可用中文、空白、貼上或密碼管理員，不要求特殊符號。'));
      form.append(checkbox('顯示密語',false,v=>{password.type=v?'text':'password';confirm.type=v?'text':'password';}));
      if(!exists)form.append(field('再輸入一次密語',confirm),checkbox('我知道忘記密語無法找回，也會自行備份日誌',false,v=>{consent=v;}));
      form.append(el('button',{type:'submit',class:'primary wide'},exists?'解鎖私人日誌':'建立加密日誌'));section.append(form);
      section.append(button('還原加密備份',()=>{this.authAction='restore';this.render(false);},'text-button'));
      if(exists)section.append(button('忘記密語／刪除本機日誌',()=>this.confirmDelete(),'text-button'));
      section.append(el('hr'),el('h3',{},'先看看怎麼用'),p('體驗不需密語，離開後不保留內容。請不要輸入真實健康資訊。','hint'),button('體驗空白日誌',()=>{this.vault.startDemo(emptyData());this.vault.data.settings.lockOnHide=false;this.route='today';this.render(false);document.getElementById('quick-marked')?.focus();},'secondary wide'),button('查看虛構示範資料',()=>{this.vault.startDemo(demoData());this.route='today';this.render(true);},'text-button'));
    }
    section.append(details('使用前知道這幾件事',p('日誌只保留在這個瀏覽器，清除網站資料、更換網址或裝置可能讓它不見。請定期下載加密備份。'),p('本程式不診斷 PMS／PMDD，不推算安全期，也不能排除疾病。加密不等於完全安全；請使用安全裝置與可信任的部署網址。')),
      button('不解鎖也能查看照顧與協助',()=>modal('照顧與協助',()=>{const page=safetyPage();page.querySelector('#page-title')?.removeAttribute('id');return [page];}),'text-button'));
    panel.append(intro,section);return panel;
  }
}
new App().init().catch(()=>announce('程式無法啟動。請保留現有資料，不要清除瀏覽器儲存；檢查 HTTPS 與瀏覽器支援後重試。',true));
