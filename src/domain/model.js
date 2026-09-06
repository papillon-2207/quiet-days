import { validDate, today, recordedMeta } from './dates.js';
export const VERSION = 1;
export const SYMPTOMS = Object.freeze({ headache: '頭痛', fatigue: '疲倦或精神不足', sleep: '睡眠', abdomen: '腹部或骨盆不適', gut: '腸胃變化', mood: '情緒', focus: '專注力', other: '其他身體變化' });
export const IMPACT = { unknown: '不確定／尚未回答', none: '有感覺，活動不受影響', slow: '需要放慢速度', rest: '需要中斷活動或休息', unable: '無法完成平常活動' };
export const TIMING = { unknown: '記不清楚／尚未回答', now: '剛剛', morning: '早上', afternoon: '下午', evening: '晚上', allDay: '一整天' };
export const CONFIDENCE = { unknown: '不確定', approximate: '大約', certain: '確定' };
export const BLEEDING = { unknown: '不確定／尚未確認', none: '沒有出血', possible: '可能有出血', spotting: '可能是點狀出血', confirmed: '已確認出血' };
export const STATUS = { marked: '有不適，先留記號', none: '今天沒有不適', unsure: '現在不確定', skipped: '今天先略過', details: '已有補充' };
export const FLOW = { unknown: '不確定／不記錄', light: '少量', typical: '一般', heavy: '很多' };
export const PRESENCE = { present: '有', absent: '沒有', unsure: '不確定' };
export const CONTINUITY = { unknown: '尚未確認是否漏記', complete: '確定這兩次開始之間沒有漏記經期', gap: '中間可能有漏記' };
export function emptyData() {
  return { version: VERSION, records: {}, settings: { lowEnergy: true, largeText: false, highContrast: false, word: '經期', lockOnHide: true, reminderTime: '', reminderDays: 1, reminderPausedUntil: '', reviewAfterStart: true, pausePrediction: false }, reminder: { day: '', snoozedUntil: '' } };
}
export function newRecord(day, status = 'marked', opts = {}) {
  if (!validDate(day) || day > today()) throw new Error('請選擇今天或以前的有效日期。');
  const meta = recordedMeta(day, opts);
  return { date: day, status, bleeding: 'unknown', flow: 'unknown', periodStart: false, periodEnd: false, continuity: 'unknown', leakage: 'unknown', productChanges: null, symptoms: {}, context: { sleepHours: null, sleepQuality: 'unknown', stress: 'unknown', illness: 'unknown', medicationChange: 'unknown', notes: '', treatment: '', relief: 'unknown' }, confidence: 'unknown', note: '', createdAt: meta.at, updatedAt: meta.at, verifiedAt: null, provenance: { capture: meta }, history: [] };
}
export function newSymptom() { return { presence: 'present', impact: 'unknown', timing: 'unknown', durationMinutes: null, location: '', companions: [], note: '' }; }
export function mutateRecord(data, date, patch, reason = '補充紀錄', opts = {}) {
  const next = structuredClone(data);
  const prior = next.records[date] ?? newRecord(date, 'marked', opts);
  const { history, ...before } = prior;
  const meta = recordedMeta(date, opts);
  const changed = { ...prior, ...patch, updatedAt: meta.at, provenance: { ...prior.provenance }, history: [...history, { at: meta.at, reason, previous: before }] };
  // Provenance is per top-level field; symptom edits additionally retain per-symptom acquisition times.
  for (const key of Object.keys(patch)) {
    if (key === 'symptoms') {
      for (const [id, value] of Object.entries(patch.symptoms)) {
        if (JSON.stringify(value) !== JSON.stringify(prior.symptoms[id])) changed.provenance[`symptom:${id}`] = meta;
      }
    } else changed.provenance[key] = meta;
  }
  if (changed.periodStart && changed.bleeding !== 'confirmed') throw new Error('只有已確認出血，才可標記經期開始。');
  if (changed.status === 'none' && Object.values(changed.symptoms).some(s => s.presence === 'present')) throw new Error('已有「有症狀」的紀錄，不能同時標示沒有明顯不適。請先修正症狀，或保留原紀錄。');
  next.records[date] = changed;
  validateData(next);
  return next;
}
export function capture(data, day, status) {
  if (!(status in STATUS) || status === 'details') throw new Error('不支援的快速紀錄。');
  if (data.records[day]) return mutateRecord(data, day, { status }, '快速標記');
  const next = structuredClone(data); next.records[day] = newRecord(day, status); validateData(next); return next;
}
export function undoRecord(data, day) {
  const next = structuredClone(data), rec = next.records[day];
  if (!rec) return next;
  if (!rec.history.length) { delete next.records[day]; return next; }
  const last = rec.history.pop();
  next.records[day] = { ...last.previous, history: rec.history };
  validateData(next); return next;
}
function assert(ok, msg = '資料格式不正確，未寫入任何內容。') { if (!ok) throw new Error(msg); }
function plain(o) { return o !== null && typeof o === 'object' && !Array.isArray(o) && (Object.getPrototypeOf(o) === Object.prototype || Object.getPrototypeOf(o) === null); }
function keys(o, allowed) { assert(plain(o)); assert(Object.keys(o).every(k => allowed.includes(k))); }
function str(s, max = 2000) { assert(typeof s === 'string' && s.length <= max); }
function option(s, obj) { assert(typeof s === 'string' && Object.hasOwn(obj, s)); }
function num(n, min, max) { assert(n === null || (Number.isFinite(n) && n >= min && n <= max)); }
function timestamp(x) { assert(typeof x === 'string' && /^\d{4}-\d\d-\d\dT/.test(x) && Number.isFinite(Date.parse(x))); }
function validateMeta(m) {
  keys(m, ['at', 'recordedDay', 'timezone', 'origin', 'afterStartRecall']); timestamp(m.at); assert(validDate(m.recordedDay)); str(m.timezone, 100); assert(['same-day', 'next-day', 'later'].includes(m.origin)); assert(typeof m.afterStartRecall === 'boolean');
}
function validateCore(r, date) {
  keys(r, ['date','status','bleeding','flow','periodStart','periodEnd','continuity','leakage','productChanges','symptoms','context','confidence','note','createdAt','updatedAt','verifiedAt','provenance']);
  assert(r.date === date && validDate(date)); option(r.status, STATUS); option(r.bleeding, BLEEDING); option(r.flow, FLOW); option(r.continuity, CONTINUITY); option(r.confidence, CONFIDENCE);
  assert(typeof r.periodStart === 'boolean' && typeof r.periodEnd === 'boolean'); assert(!r.periodStart || r.bleeding === 'confirmed'); assert(['unknown','yes','no'].includes(r.leakage)); num(r.productChanges, 0, 100); assert(r.productChanges === null || Number.isInteger(r.productChanges));
  keys(r.symptoms, Object.keys(SYMPTOMS));
  for (const s of Object.values(r.symptoms)) {
    keys(s, ['presence','impact','timing','durationMinutes','location','companions','note']); option(s.presence, PRESENCE); option(s.impact, IMPACT); option(s.timing, TIMING); num(s.durationMinutes, 0, 1440); str(s.location, 200); str(s.note, 2000); assert(Array.isArray(s.companions) && s.companions.length <= 16); s.companions.forEach(v => str(v, 100));
  }
  assert(!(r.status === 'none' && Object.values(r.symptoms).some(s => s.presence === 'present')));
  keys(r.context, ['sleepHours','sleepQuality','stress','illness','medicationChange','notes','treatment','relief']); num(r.context.sleepHours, 0, 24);
  for(const k of ['sleepQuality','stress'])assert(['unknown','low','medium','high'].includes(r.context[k]));
  for(const k of ['illness','medicationChange'])assert(['unknown','yes','no'].includes(r.context[k]));
  assert(['unknown','better','same','worse'].includes(r.context.relief));
  str(r.context.notes); str(r.context.treatment); str(r.note); timestamp(r.createdAt); timestamp(r.updatedAt); if (r.verifiedAt !== null) timestamp(r.verifiedAt);
  assert(plain(r.provenance)); assert(Object.keys(r.provenance).length <= 40); assert(r.provenance.capture); Object.values(r.provenance).forEach(validateMeta);
}
export function validateData(data) {
  keys(data, ['version','records','settings','reminder']); assert(data.version === VERSION, '備份版本不相容；請保留原檔，不會自動覆寫。'); assert(plain(data.records)); assert(Object.keys(data.records).length <= 10000);
  for (const [day, r] of Object.entries(data.records)) {
    assert(plain(r)); const { history, ...core } = r; validateCore(core, day); assert(Array.isArray(history) && history.length <= 5000);
    for (const h of history) { keys(h, ['at','reason','previous']); timestamp(h.at); str(h.reason, 200); validateCore(h.previous, day); }
  }
  const s = data.settings; keys(s, ['lowEnergy','largeText','highContrast','word','lockOnHide','reminderTime','reminderDays','reminderPausedUntil','reviewAfterStart','pausePrediction']);
  for (const k of ['lowEnergy','largeText','highContrast','lockOnHide','reviewAfterStart','pausePrediction']) assert(typeof s[k] === 'boolean'); str(s.word, 16); assert(s.word.trim().length > 0); assert(s.reminderTime === '' || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.reminderTime)); assert([1,2].includes(s.reminderDays)); assert(s.reminderPausedUntil === '' || validDate(s.reminderPausedUntil));
  keys(data.reminder, ['day','snoozedUntil']); assert(data.reminder.day === '' || validDate(data.reminder.day)); assert(data.reminder.snoozedUntil === '' || Number.isFinite(Date.parse(data.reminder.snoozedUntil)));
  return data;
}
export function recordSummary(r) {
  if (!r) return '未填寫；不知道是否有症狀';
  const parts = [STATUS[r.status], BLEEDING[r.bleeding]];
  if (r.periodStart) parts.push('使用者確認經期開始');
  if (r.periodEnd) parts.push('使用者確認本次出血結束');
  for (const [k, s] of Object.entries(r.symptoms)) parts.push(`${SYMPTOMS[k]}：${PRESENCE[s.presence]}${s.presence === 'present' ? `，${IMPACT[s.impact]}` : ''}`);
  return parts.join('；');
}
