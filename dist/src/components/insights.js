import {el,p,heading,card,details,button} from '../lib/dom.js';
import {dateLabel} from '../domain/dates.js';
import {cycleAnalysis,symptomPatterns} from '../domain/analysis.js';
export function insightsPage(app) {
  const data=app.vault.data, cycle=cycleAnalysis(data), patterns=symptomPatterns(data);
  const root=el('div',{},heading('理解模式，不急著下結論。','出血、症狀與生活情境分開看。沒有紀錄的日子，不會被填成「沒有症狀」。','個人模式'));
  root.append(card('下次經期的粗略範圍',cycle.prediction?el('div',{class:'prediction'},p(`${dateLabel(cycle.prediction.from)} 至 ${dateLabel(cycle.prediction.to)}`,'range'),p(cycle.prediction.label,'badge')):p('目前先不估計。','range'),p(cycle.reason),details('怎麼算？有哪些限制？',p(cycle.method),p('不採用 28 天通用週期、不推算排卵或安全期，也不把頭痛、疲倦或未開啟 App 視為經期開始。資料不足時不顯示百分比「信心」。'),p('日期範圍到期後會暫停，而不是自行往後移一個週期。每次改正開始日，都由資料重新計算。'),p('開始日差距小於 15 天、大於 90 天，或最近區間差距超過 14 天時暫停；這些是本版保守操作門檻，不是醫學正常值。')),button('到日誌修正已確認日期',()=>app.navigate('journal'),'text-button')));
  const table=el('table',{},el('caption',{},'已確認開始日之間的日期差（不代表每段都完整）'),el('thead',{},el('tr',{},...['從','至','天數','資料狀況'].map(t=>el('th',{scope:'col'},t)))));
  const body=el('tbody',{});for(const i of cycle.intervals)body.append(el('tr',{},el('th',{scope:'row'},i.start),el('td',{},i.end),el('td',{},String(i.length)),el('td',{},i.usable?'已確認無漏記':'未知或可能漏記')));table.append(body);
  root.append(details(`出血時間軸：${cycle.anchors.length} 個已確認開始日`,cycle.intervals.length?el('div',{class:'table-scroll',tabindex:'0','aria-label':'可左右捲動的週期間隔資料表'},table):p('尚無可比較的開始日。')));
  const section=card('症狀時間軸',p('比較「下一次已確認開始前 7 天」與該完整區間其他日。這是描述，不是診斷或因果判斷。','hint'));
  const viewed=patterns.filter(x=>x.pre.observed+x.other.observed>0);
  if(!viewed.length)section.append(p('目前還沒有可比較的症狀觀察。可以只記你在意的症狀，不必填滿所有項目。'));
  for(const x of viewed) {
    const t=el('table',{},el('caption',{},`${x.name}的觀察分母（未知不納入分母）`),el('thead',{},el('tr',{},...['窗口','有症狀／已觀察日','未觀察日','回憶填寫日'].map(v=>el('th',{scope:'col'},v)))),el('tbody',{},...[[`開始前 7 天`,x.pre],['其他日',x.other]].map(([name,b])=>el('tr',{},el('th',{scope:'row'},name),el('td',{},`${b.present} / ${b.observed}`),el('td',{},String(b.total-b.observed)),el('td',{},String(b.retrospective))))));
    section.append(details(`${x.name}：${x.repeatedCycles}／${x.cycles} 個完整區間在開始前有觀察到`,el('div',{class:'table-scroll',tabindex:'0','aria-label':`${x.name}觀察資料表`},t),p(x.sufficient?'已有一些可以描述的重複資料，但未校準為關聯機率。':'資料仍稀少；不比較百分比、不判定有無關聯。'),p(x.caveat,'hint')));
  }
  root.append(section,card('也看看其他可能因素',p('睡眠不足、生病、壓力與藥物改變可能同時出現。它們會在個別紀錄與你選擇的分享摘要中呈現，本版不以統計模型推定或排除病因。'),p('頭痛在週期其他日也可能發生；偏頭痛本身也可能伴隨疲倦。新出現或嚴重的症狀，不能因為符合以往的時間模式就忽略。'),button('查看照顧與協助',()=>app.navigate('help'),'secondary')));
  return root;
}
