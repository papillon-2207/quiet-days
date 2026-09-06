import { dateLabel, today, originLabels } from './dates.js';
import { SYMPTOMS, PRESENCE, IMPACT, TIMING, BLEEDING, FLOW, STATUS, CONTINUITY, CONFIDENCE } from './model.js';
function cell(s) { let v = String(s ?? ''); if (/^[\s]*[=+\-@]/.test(v) || /^[\t\r\n]/.test(v)) v = `'${v}`; return `"${v.replaceAll('"','""')}"`; }
export function selectedRecords(data, from, to) { return Object.values(data.records).filter(r => r.date >= from && r.date <= to).sort((a,b) => a.date.localeCompare(b.date)); }
/** Field scope applies to BOTH detail and derived narrative; unselected data never leaks into export. */
export function reportRows(data, {from, to, fields}) {
  const header = ['日期','填寫狀態'];
  if (fields.bleeding) header.push('出血','程度','使用者確認開始','使用者確認結束','區間連續性','用品更換次數','滲漏');
  if (fields.symptoms) header.push('症狀與功能影響');
  if (fields.context) header.push('睡眠小時','睡眠品質','壓力','生病','藥物改變','背景補充','採取措施','處理後狀況');
  if (fields.notes) header.push('自由備註');
  if (fields.provenance) header.push('初次輸入時間','最近修改時間','填寫來源','確認程度','事後確認時間','欄位輸入歷程');
  const rows = selectedRecords(data,from,to).map(r => {
    const row = [r.date, STATUS[r.status]];
    if (fields.bleeding) row.push(BLEEDING[r.bleeding],FLOW[r.flow],r.periodStart ? '是':'否',r.periodEnd ? '是':'否',CONTINUITY[r.continuity],r.productChanges === null ? '未知':r.productChanges,{unknown:'不確定',yes:'有',no:'沒有'}[r.leakage]);
    if (fields.symptoms) row.push(Object.entries(r.symptoms).map(([id,s]) => s.presence==='present' ? `${SYMPTOMS[id]}：${PRESENCE[s.presence]}，${IMPACT[s.impact]}，${TIMING[s.timing]}，持續${s.durationMinutes ?? '未知'}分鐘；位置：${s.location || '未填'}；伴隨：${s.companions.join('、') || '未填'}；${s.note}` : `${SYMPTOMS[id]}：${PRESENCE[s.presence]}；${s.note}`).join('／') || '未詢問或未填寫，不等於沒有症狀');
    if (fields.context) row.push(r.context.sleepHours ?? '未知',r.context.sleepQuality,r.context.stress,r.context.illness,r.context.medicationChange,r.context.notes,r.context.treatment,r.context.relief);
    if (fields.notes) row.push(r.note);
    if (fields.provenance) {
      const permitted = new Set(['capture','status','confidence','verifiedAt']);
      if (fields.bleeding) ['bleeding','flow','periodStart','periodEnd','continuity','productChanges','leakage'].forEach(k => permitted.add(k));
      if (fields.symptoms) Object.keys(SYMPTOMS).forEach(k => permitted.add(`symptom:${k}`));
      if (fields.context) permitted.add('context'); if(fields.notes) permitted.add('note');
      row.push(r.createdAt,r.updatedAt,originLabels[r.provenance.capture.origin],CONFIDENCE[r.confidence],r.verifiedAt ?? '未確認',Object.entries(r.provenance).filter(([k]) => permitted.has(k)).map(([k,m])=>`${k}: ${m.at} / ${originLabels[m.origin]}${m.afterStartRecall ? ' / 開始出血後回顧':''}`).join('；'));
    }
    return row;
  });
  return {header, rows};
}
export function csvReport(data, options) { const {header,rows}=reportRows(data,options); return '\uFEFF'+[header,...rows].map(row => row.map(cell).join(',')).join('\r\n'); }
export function textReport(data, options) {
  const {header,rows} = reportRows(data,options);
  return `個人身體日誌\n期間：${dateLabel(options.from)} 至 ${dateLabel(options.to)}\n\n由使用者自行填寫；未填寫不代表無症狀。當日填寫不代表發生當下。補登不等同前瞻性臨床量表；本文件不能診斷 PMS、PMDD 或偏頭痛。\n以下僅包含自行選擇的欄位。完整修正前內容僅在加密備份保留。\n\n`+rows.map(row => row.map((v,i) => `${header[i]}：${v}`).join('\n')).join('\n\n');
}
export function reminderCalendar({time, interval=1, day=today(), now=new Date()}) {
  if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) || ![1,2].includes(interval)) throw new Error('請先選擇有效的提醒時間。');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Quiet Days//Private Reminder//ZH-TW','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${crypto.randomUUID()}@quiet-days.invalid`,`DTSTAMP:${now.toISOString().replaceAll('-','').replaceAll(':','').replace(/\.\d{3}/,'')}`,`DTSTART:${day.replaceAll('-','')}T${time.replace(':','')}00`,'DURATION:PT5M',`RRULE:FREQ=DAILY;INTERVAL=${interval};COUNT=30`,'SUMMARY:私人提醒','DESCRIPTION:可以略過的一項私人紀錄。','CLASS:PRIVATE','BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:PT0M','DESCRIPTION:私人提醒','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
export function downloadFile(content, filename, mime='text/plain;charset=utf-8') {
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  const a=document.createElement('a'); a.href=url; a.download=filename; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000);
}
