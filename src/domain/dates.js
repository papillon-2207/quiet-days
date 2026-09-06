/** Calendar dates are local civil dates, not UTC instants. Never use toISOString().slice(0,10) for today. */
export function today(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function validDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const x = new Date(Date.UTC(y, m - 1, d));
  return x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d;
}
export function epochDay(s) {
  if (!validDate(s)) throw new Error('日期格式不正確。');
  return Date.parse(`${s}T12:00:00Z`) / 86400000;
}
export function daysBetween(a, b) { return Math.round(epochDay(b) - epochDay(a)); }
export function addDays(s, n) {
  return new Date((epochDay(s) + n) * 86400000).toISOString().slice(0, 10);
}
export function dateLabel(s) {
  if (!validDate(s)) return '日期不確定';
  return new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', timeZone: 'UTC' }).format(new Date(`${s}T12:00:00Z`));
}
export function originFor(day, at = new Date().toISOString(), localRecordedDay = today(new Date(at))) {
  const delay = daysBetween(day, localRecordedDay);
  return delay <= 0 ? 'same-day' : delay === 1 ? 'next-day' : 'later';
}
export const originLabels = { 'same-day': '當日填寫（不一定為症狀發生當下）', 'next-day': '隔日回憶', later: '較晚回憶' };
export function recordedMeta(day, opts = {}) {
  const at = opts.at ?? new Date().toISOString();
  const recordedDay = opts.recordedDay ?? today(new Date(at));
  return { at, recordedDay, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown', origin: originFor(day, at, recordedDay), afterStartRecall: Boolean(opts.afterStartRecall) };
}
