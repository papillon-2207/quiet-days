import {el,p,heading,card,button,field,select,checkbox,details,modal,announce} from '../lib/dom.js';
import {today,dateLabel,originLabels} from '../domain/dates.js';
import {newRecord,newSymptom,mutateRecord,SYMPTOMS,IMPACT,TIMING,CONFIDENCE,BLEEDING,FLOW,PRESENCE,CONTINUITY,STATUS,recordSummary} from '../domain/model.js';
import {localSpeechStatus,startLocalDictation} from '../lib/speech.js';

export function editorPage(app,day,opts={}) {
  let draft=structuredClone(app.vault.data.records[day] ?? newRecord(day));
  let timer=null, pending={}, failure=false, active=true, saving=null;
  const root=el('div',{},heading(day===today()?'記一點，就好。':`${dateLabel(day)}`,'每項都可以不回答。下拉選項即時儲存；文字停止輸入後會儲存。離開前會等待儲存完成。',day===today()?'今天的身體紀錄':'事後補登'));
  if(day < today()) root.append(p('這一天的內容將保留實際填寫時間，並標示為回憶；不會冒充當日紀錄。','notice'));
  if(opts.afterStartRecall) root.append(p('你是從開始出血後的回顧進入。這項來源會保留下來，不會自動判定症狀與經期有關。','notice'));
  const saveStatus=p('尚未修改。','save-status');saveStatus.setAttribute('role','status');saveStatus.setAttribute('aria-live','polite');
  const retry=button('重試儲存',async()=>{await flush();},'secondary',{hidden:true});
  root.append(button('先查看照顧與協助',()=>app.navigate('help'),'text-button'),el('div',{class:'editor-save'},saveStatus,retry));
  function flush() {
    clearTimeout(timer); timer=null;
    if (saving) return saving;
    // One drain per editor: a failed older write can never be replayed over
    // a successful newer edit. New input merges into pending, latest value wins.
    saving=(async()=>{
      while(Object.keys(pending).length) {
        const patch=structuredClone(pending); pending={};
        app.dirty=true; saveStatus.textContent='正在加密儲存…';
        const ok=await app.commit(d=>mutateRecord(d,day,patch,'補充或修正',opts),'',false);
        if(!ok) {
          pending={...patch,...pending};failure=true;app.dirty=true;
          saveStatus.textContent='尚未儲存。請重試，或先複製你輸入的內容。';retry.hidden=false;
          return false;
        }
        failure=false;retry.hidden=true;
      }
      await app.vault.tail;
      app.dirty=false;
      saveStatus.textContent=app.vault.demo?'已留在本次體驗中。':'已加密儲存在這個裝置。';
      return !failure;
    })().finally(()=>{saving=null;});
    return saving;
  }
  function queue(patch,defer=false) {
    Object.assign(draft,structuredClone(patch));pending={...pending,...structuredClone(patch)};app.dirty=true;failure=false;saveStatus.textContent='有內容等待儲存。';clearTimeout(timer);
    if(defer)timer=setTimeout(flush,450);else void flush();
  }
  app.flushEditor=flush;
  app.cleanupEditor=()=>{active=false;clearTimeout(timer);app.stopSpeech?.();app.stopSpeech=null;};
  function patchSymptom(id,key,value,defer=false) {
    const symptoms=structuredClone(draft.symptoms);symptoms[id][key]=value;
    queue({symptoms,status:'details'},defer);
  }
  function number(label,value,onValue,max,help='') {
    const input=el('input',{type:'number',min:'0',max:String(max),step:'any',value:value===null?'':String(value),inputmode:'decimal',on:{change:e=>{if(e.target.reportValidity())onValue(e.target.value===''?null:Number(e.target.value));}}});
    return field(label,input,help);
  }
  function text(label,value,onValue,help='',max=2000) {
    const input=el('textarea',{rows:'3',maxlength:String(max),autocomplete:'off',spellcheck:'false',on:{input:e=>onValue(e.target.value),blur:()=>void flush()}});input.value=value;
    return field(label,input,help);
  }
  const symptomSection=card('想多補哪一項？',p('一次選一項即可。沒有被詢問或沒有選到的症狀，不會被當成「沒有」。','hint'));
  const symptomBody=el('div',{});
  function renderSymptoms() {
    symptomBody.replaceChildren();
    for(const [id,s] of Object.entries(draft.symptoms)) {
      const form=card(SYMPTOMS[id],select(`${SYMPTOMS[id]}對活動的影響`,IMPACT,s.impact,v=>patchSymptom(id,'impact',v)),select(`${SYMPTOMS[id]}大約何時發生`,day===today()?TIMING:{...Object.fromEntries(Object.entries(TIMING).filter(([k])=>k!=='now')),...(s.timing==='now'?{now:'原始紀錄填寫當時（保留原值）'}:{})},s.timing,v=>patchSymptom(id,'timing',v)));
      const companionOptions=id==='headache'?['噁心','嘔吐','怕光','怕聲']:id==='gut'?['腹脹','便祕','腹瀉','噁心','排便改變']:id==='abdomen'?['持續','間歇','單側','突然出現','和平常不同']:['和平常不同'];
      const extras=details(`${SYMPTOMS[id]}：其他細節（選填）`,select(`${SYMPTOMS[id]}是否出現`,PRESENCE,s.presence,v=>patchSymptom(id,'presence',v),'選取症狀代表想記它有出現；這裡可修正為沒有或不確定。'),number('持續時間（分鐘；不清楚可留白）',s.durationMinutes,v=>patchSymptom(id,'durationMinutes',v),1440),
        text('位置或感受',s.location,v=>patchSymptom(id,'location',v,true),'腹部、骨盆或腸胃的感受可以分開描述，不需要自己判定病因。',200),
        el('fieldset',{},el('legend',{},'伴隨狀況（只記你知道的）'),...companionOptions.map(label=>checkbox(label,s.companions.includes(label),checked=>{const a=draft.symptoms[id].companions;patchSymptom(id,'companions',checked?[...new Set([...a,label])]:a.filter(x=>x!==label));}))),
        text('症狀備註',s.note,v=>patchSymptom(id,'note',v,true)));
      form.append(extras,button(`移除${SYMPTOMS[id]}這一項`,async()=>{
        const next=structuredClone(draft.symptoms);delete next[id];queue({symptoms:next,status:'details'});await flush();renderSymptoms();document.getElementById(`add-${id}`)?.focus();
      },'text-button'));
      symptomBody.append(form);
    }
  }
  const picks=el('div',{class:'symptom-picks'});
  for(const [id,label] of Object.entries(SYMPTOMS)) picks.append(button(label,async()=>{
    if(!draft.symptoms[id]) {queue({symptoms:{...draft.symptoms,[id]:newSymptom()},status:'details'});await flush();}
    renderSymptoms();symptomBody.querySelectorAll('section h2')[Object.keys(draft.symptoms).indexOf(id)]?.parentElement.querySelector('select')?.focus();
  },'chip',{id:`add-${id}`}));
  symptomSection.append(picks);root.append(symptomSection,symptomBody);renderSymptoms();
  const bleeding=card('出血：與症狀分開記',p('不要求看顏色、拍照，或找別人確認。只有你明確確認的開始日才可用於週期估計。','hint'));
  const start=checkbox('我已確認這一天是本次經期開始',draft.periodStart,async checked=>{
    if(checked && draft.bleeding!=='confirmed') {announce('請先選擇「已確認出血」，再確認開始日。',true);start.querySelector('input').checked=false;return;}
    queue({periodStart:checked});await flush();
  });
  bleeding.append(select('這一天的出血狀況',BLEEDING,draft.bleeding,v=>{
    const patch={bleeding:v};if(v!=='confirmed'){patch.periodStart=false;start.querySelector('input').checked=false;}queue(patch);
  }),start,checkbox('我已確認本次出血在這一天結束',draft.periodEnd,v=>queue({periodEnd:v})),
    details('出血程度與週期間隔（選填）',select('程度',FLOW,draft.flow,v=>queue({flow:v})),select('與上一次已確認開始之間',CONTINUITY,draft.continuity,v=>queue({continuity:v}),'只在確認開始日時有分析作用；不清楚就保留未知。'),number('這一天用品更換次數',draft.productChanges,v=>{if(v!==null&&!Number.isInteger(v)){announce('用品更換次數請填整數。',true);return;}queue({productChanges:v});},100,'更換頻率不等同精確出血量；完全選填。'),select('是否滲漏',{unknown:'不確定／不記錄',yes:'有',no:'沒有'},draft.leakage,v=>queue({leakage:v}))));
  root.append(details('記錄或修正出血狀況',bleeding));
  function patchContext(k,v,defer=false) {queue({context:{...draft.context,[k]:v}},defer);}
  root.append(details('睡眠、生活情境與採取措施（全部選填）',
    p('這些是背景線索，不會用來否定你的症狀，也不會被當成診斷。','hint'),number('睡眠時間（小時）',draft.context.sleepHours,v=>patchContext('sleepHours',v),24),
    select('睡眠品質',{unknown:'不確定／不記錄',low:'不好',medium:'普通',high:'很好'},draft.context.sleepQuality,v=>patchContext('sleepQuality',v)),
    select('壓力感受',{unknown:'不確定／不記錄',low:'較低',medium:'中等',high:'較高'},draft.context.stress,v=>patchContext('stress',v)),
    select('最近是否生病',{unknown:'不確定／不記錄',yes:'是',no:'否'},draft.context.illness,v=>patchContext('illness',v)),
    select('藥物或荷爾蒙使用是否改變',{unknown:'不確定／不記錄',yes:'有改變',no:'沒有改變'},draft.context.medicationChange,v=>patchContext('medicationChange',v),'不要求填藥名、性生活或避孕資訊。健康狀況改變時，可到設定暫停週期估計。'),
    text('其他背景（例如漏餐、飲水、壓力事件）',draft.context.notes,v=>patchContext('notes',v,true)),text('採取的措施（例如休息、熱敷、既有醫囑用藥或就醫）',draft.context.treatment,v=>patchContext('treatment',v,true)),
    select('採取措施後',{unknown:'不確定／不記錄',better:'比較好',same:'差不多',worse:'比較不舒服'},draft.context.relief,v=>patchContext('relief',v))));
  const noteInput=el('textarea',{rows:'4',maxlength:'2000',autocomplete:'off',spellcheck:'false',id:'free-note',on:{input:e=>queue({note:e.target.value},true),blur:()=>void flush()}});noteInput.value=draft.note;
  const voice=button('檢查裝置端語音是否可用',async()=>{
    const result=await localSpeechStatus();
    if(result!=='available'){announce('本機繁體中文辨識不可用。不會啟用雲端辨識，請直接輸入文字。');return;}
    modal('語音只會在這個裝置處理',close=>[
      p('按下開始才收音，最長 30 秒。辨識結果先預覽，由你確認後才寫入；不儲存原始錄音。不會自動朗讀敏感內容。'),
      button('開始本機語音輸入',async()=>{
        close();try{app.stopSpeech=await startLocalDictation(transcript=>{
          if(!active)return;
          modal('確認辨識文字',finish=>{
            const preview=el('textarea',{rows:'4',maxlength:'2000',id:'voice-preview'});preview.value=transcript;
            return [field('辨識結果（可以修正）',preview),p('請特別確認「沒有出血」等否定詞。本版不會自行解析成症狀或出血狀態。','hint'),button('確認，加入備註',()=>{const text=(draft.note?draft.note+'\n':'')+preview.value;if(text.length>2000){announce('備註最多 2000 字，請縮短。',true);return;}noteInput.value=text;queue({note:text});finish();},'primary')];
          });
        },()=>{app.stopSpeech=null;},message=>announce(message,true));announce('本機語音輸入已開始，30 秒內自動停止。');}catch(e){announce(e.message,true);}
      },'primary')]);
  },'secondary');
  root.append(details('備註與選配語音',field('想留下的其他內容',noteInput,'文字會加密儲存。系統鍵盤聽寫的資料處理由作業系統設定決定，本程式無法保證它在裝置端運作。'),voice,button('停止語音輸入',()=>{app.stopSpeech?.();app.stopSpeech=null;announce('已停止語音輸入。');},'text-button')));
  const provenance=app.vault.data.records[day]?.provenance.capture ?? draft.provenance.capture;
  root.append(card('確認與完成',select('你對這一天回憶的確定程度',CONFIDENCE,draft.confidence,v=>queue({confidence:v})),p(`初次留下記號：${originLabels[provenance.origin]}。初次輸入時間：${provenance.at}。`,'hint'),
    el('div',{class:'actions'},button('今天先到這裡',async()=>{if(await flush())await app.navigate('today');},'primary'),button('確認這些是我目前記得的',async()=>{queue({verifiedAt:new Date().toISOString()});if(await flush()){announce('已記下你的確認；不會把回憶改成即時資料。');await app.navigate('journal');}},'secondary'))));
  const current=app.vault.data.records[day];
  root.append(details('查看輸入來源與修正歷程',p('完整修正前內容留在加密備份；這裡逐次顯示時間和當時摘要。復原不是不可竄改的醫療稽核。','hint'),...(current?.history ?? []).slice().reverse().map(h=>el('article',{class:'history-item'},p(`${h.at} · ${h.reason}`),p(recordSummary(h.previous)))),!current?.history.length?p('尚無修正歷程。'):null));
  root.append(button('刪除這一天的全部紀錄',()=>modal('刪除這一天？',close=>[p('這一天的內容、修正歷程與由此產生的分析都會移除。已匯出的檔案不會跟著刪除。'),button('確認刪除這一天',async()=>{pending={};clearTimeout(timer);await app.vault.tail;if(await app.commit(d=>{delete d.records[day];return d;},'已刪除這一天。')){app.dirty=false;close();await app.navigate('journal');}},'danger')]),'text-button danger-text'));
  return root;
}
