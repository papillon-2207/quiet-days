import { today, daysBetween } from './dates.js';
export function reminderDue(data, now = new Date()) {
  const day = today(now), s = data.settings, r = data.reminder;
  if (!s.reminderTime || s.reminderPausedUntil >= day || data.records[day]) return false;
  const clock = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  if (clock < s.reminderTime) return false;
  if (r.snoozedUntil && Date.parse(r.snoozedUntil) > now.getTime()) return false;
  if (r.snoozedUntil && Date.parse(r.snoozedUntil) <= now.getTime() && r.day === day) return true;
  return !r.day || daysBetween(r.day,day) >= s.reminderDays;
}
