import { addDays, daysBetween, today } from './dates.js';
import { SYMPTOMS } from './model.js';
/** Transparent descriptive heuristic, not a calibrated medical predictor or diagnostic instrument. */
export function cycleAnalysis(data, current = today()) {
  const anchors = Object.values(data.records).filter(r => r.periodStart && r.bleeding === 'confirmed' && r.date <= current).sort((a,b) => a.date.localeCompare(b.date));
  const intervals = anchors.slice(1).map((r, i) => ({ start: anchors[i].date, end: r.date, length: daysBetween(anchors[i].date, r.date), usable: r.continuity === 'complete', continuity: r.continuity }));
  const recent = intervals.slice(-6);
  const base = { anchors, intervals, prediction: null, reason: '', method: '最近最多 6 個、由使用者確認沒有漏記的完整區間；最短天數 −2 至最長天數 +2。這是保守範圍，不是機率或醫療標準。' };
  if (data.settings.pausePrediction) return { ...base, reason: '你已暫停估計。可因藥物、健康狀況或週期改變而暫停，不需說明原因。' };
  if (recent.length < 3) return { ...base, reason: `目前有 ${recent.length} 個起訖區間。至少 3 個已確認無漏記的完整區間才顯示粗略範圍；不是要求你補滿資料。` };
  if (recent.some(i => !i.usable)) return { ...base, reason: '最近區間尚有漏記或不確定；暫停估計，不把漏記算成長週期。' };
  const lengths = recent.map(i => i.length), lo = Math.min(...lengths), hi = Math.max(...lengths);
  if (lo < 15 || hi > 90 || hi-lo > 14) return { ...base, reason: '目前日期差異較大或需要確認；本版保守地暫停估計。這不代表醫學上的異常。' };
  const last = anchors.at(-1).date;
  const from = addDays(last, lo-2), to = addDays(last, hi+2);
  if (current > to) return { ...base, reason: '上次粗略範圍已過，沒有自動假設新的經期開始。可補記已確認日期，或繼續留白。' };
  return { ...base, reason: `以 ${recent.length} 個完整區間描述；沒有使用症狀或未開啟 App 的行為猜測經期。`, prediction: { from, to, intervalCount: recent.length, label: '資料有限的粗略範圍' } };
}
/** Absence requires explicit symptom absence or a global no-symptom report; skipped/missing is never absence. */
export function observation(r, symptom) {
  if (!r) return null;
  if (r.symptoms[symptom]) {
    const s = r.symptoms[symptom];
    return s.presence === 'unsure' ? null : { present: s.presence === 'present', retrospective: (r.provenance[`symptom:${symptom}`] ?? r.provenance.capture).origin !== 'same-day' };
  }
  if (r.status === 'none') return { present: false, retrospective: (r.provenance.status ?? r.provenance.capture).origin !== 'same-day' };
  return null;
}
export function symptomPatterns(data, current = today()) {
  const { intervals } = cycleAnalysis(data, current);
  const periods = intervals.filter(i => i.usable && i.length >= 15 && i.length <= 90).slice(-6);
  return Object.keys(SYMPTOMS).map(symptom => {
    const pre = { present: 0, observed: 0, total: 0, retrospective: 0 }, other = { present: 0, observed: 0, total: 0, retrospective: 0 };
    let repeatedCycles = 0;
    for (const p of periods) {
      let found = false;
      for (let n=0; n<p.length; n++) {
        const day = addDays(p.start, n), bucket = n >= p.length-7 ? pre : other; bucket.total++;
        const o = observation(data.records[day], symptom);
        if (o) { bucket.observed++; if (o.present) { bucket.present++; if(bucket === pre) found = true; } if(o.retrospective) bucket.retrospective++; }
      }
      if (found) repeatedCycles++;
    }
    return { symptom, name: SYMPTOMS[symptom], pre, other, cycles: periods.length, repeatedCycles,
      sufficient: periods.length >= 2 && pre.observed >= 7 && other.observed >= 7,
      caveat: '「開始前 7 天」只是本版的描述窗口。填寫日期與回憶可能偏差；這不是 PMS、PMDD 或經期偏頭痛診斷，也不證明因果。' };
  });
}
