import { el,p,heading,card,button,checkbox,details } from '../lib/dom.js';
import { today,addDays,dateLabel } from '../domain/dates.js';
import { STATUS,recordSummary,capture,undoRecord } from '../domain/model.js';
import { cycleAnalysis } from '../domain/analysis.js';
export function homePage(app) {
  const data=app.vault.data, day=today(), rec=data.records[day], low=data.settings.lowEnergy;
  const root=el('div',{},heading('今天，先照顧自己。','有餘力再補充。現在留一個記號，也已經足夠。',dateLabel(day)));
  const quick=card('',el('div',{class:'section-top'},el('h2',{},'先留一個記號'),el('span',{class:'badge'},low?'低能量模式':'一般模式')),p('不需要分類症狀，也不必說明原因。選擇「今天沒有不適」表示沒有本日誌追蹤的身體或情緒不適，不表示沒有出血。','hint'));
  const group=el('div',{class:'quick-grid'});
  for(const status of ['marked','none','unsure','skipped']) {
    const label=STATUS[status];
    group.append(button(label,async()=>{
      const focus=`quick-${status}`;
      if(await app.commit(d=>capture(d,day,status),'已留下今天的記號。可以結束，或稍後補充。')) {app.render(false);document.getElementById(focus)?.focus();}
    },status==='marked'?'quick primary':'quick secondary',{id:`quick-${status}`}));
  }
  quick.append(group);
  if(rec) quick.append(el('div',{class:'saved-preview'},el('span',{class:'badge'},app.vault.demo?'僅本次體驗':'已加密儲存'),p(recordSummary(rec)),el('div',{class:'actions'},button('補一項內容',()=>app.edit(day),'secondary'),button('復原上一步',async()=>{if(await app.commit(d=>undoRecord(d,day),'已復原這一天的上一步。'))app.render(false);},'text-button'))));
  else quick.append(p('未填寫不代表沒有症狀；留白也可以。','hint'));
  quick.append(checkbox('只顯示低能量介面',low,async checked=>{await app.setting('lowEnergy',checked);app.render(false);},'關閉時，首頁會多顯示週期資訊；不會增加提醒次數。'));
  root.append(quick);
  root.append(el('div',{class:'two-col'},card('現在只想補昨天？',p('不用找日曆。一次回顧一天，不需要把空白補滿。'),button('補昨天的紀錄',()=>app.edit(addDays(day,-1)),'secondary'),button('選擇其他日期',()=>app.navigate('journal'),'text-button')),
    card('只有你決定要記多少',p('「不確定」和「先略過」都是有效的選擇。這裡沒有連續打卡，也沒有未完成的懲罰。'),button('查看可補充的記號',()=>app.navigate('journal'),'text-button'))));
  if(rec?.periodStart && data.settings.reviewAfterStart) {
    root.append(card('回顧最近幾天（可略過）',p('今天已由你確認開始出血。最近幾天有沒有任何變化值得留下？補登會標示為事後回憶，不會預先歸因為 PMS。'),el('div',{class:'actions'},...[1,2,3].map(n=>button(n===1?'回顧昨天':`回顧 ${n} 天前`,()=>app.edit(addDays(day,-n),{afterStartRecall:true}),'secondary'))),button('不要再顯示這項回顧',async()=>{await app.setting('reviewAfterStart',false);app.render(false);},'text-button')));
  }
  const result=cycleAnalysis(data);
  const cycle=card('週期是線索，不是結論',p(result.prediction?`粗略範圍：${dateLabel(result.prediction.from)} 至 ${dateLabel(result.prediction.to)}`:result.reason),p('頭痛、疲倦或腸胃不適可能有不同原因，不會被用來自動標記經期開始。','hint'),button('看個人模式與資料限制',()=>app.navigate('insights'),'text-button'));
  root.append(low ? details('有餘力時，再看週期資訊',cycle):cycle);
  root.append(p('不舒服和平常不同，或影響生活時，不必等日誌完整才就醫。','hint'));
  return root;
}
export function journalPage(app) {
  const data=app.vault.data, day=today(), root=el('div',{},heading('把想記的，慢慢補上。','一次一天。跳過不影響任何功能。','日誌與補登'));
  const input=el('input',{type:'date',value:app.selectedDay || day,max:day,min:'1900-01-01',id:'journal-date'});
  const form=el('form',{on:{submit:e=>{e.preventDefault(); if(input.reportValidity())app.edit(input.value);}}},el('label',{for:'journal-date'},'想記錄哪一天？'),el('div',{class:'actions'},input,el('button',{type:'submit',class:'primary'},'開啟這一天')));
  input.required=true; root.append(card('',form));
  const waiting=Object.values(data.records).filter(r=>!r.verifiedAt && ['marked','unsure'].includes(r.status)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14);
  if(waiting.length) root.append(card('可以補充的記號（不是待辦）',p('只顯示最近 14 筆；不必全部完成。','hint'),...waiting.map(r=>button(`${dateLabel(r.date)} · ${STATUS[r.status]}`,()=>app.edit(r.date),'day-button'))));
  const recent=card('最近七天',p('每一天都以文字呈現，沒有資料的日期會清楚標示。','hint'));
  for(let n=0;n<7;n++) {const d=addDays(day,-n);recent.append(button(`${dateLabel(d)}：${recordSummary(data.records[d])}`,()=>app.edit(d),'day-button'));}
  root.append(recent);
  const all=Object.keys(data.records).sort().reverse();
  root.append(details(`所有已留下的日期（${all.length} 天）`,...all.map(d=>button(`${dateLabel(d)}：${recordSummary(data.records[d])}`,()=>app.edit(d),'day-button'))));
  return root;
}
