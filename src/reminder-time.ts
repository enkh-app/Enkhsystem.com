export const DEFAULT_TIMEZONE = 'Asia/Ulaanbaatar';
function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  return Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]));
}
export function localDateTimeToUtc(date: string, time: string, timeZone: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  try { new Intl.DateTimeFormat('en', { timeZone }).format(); } catch { return null; }
  const [year, month, day] = date.split('-').map(Number); const [hour, minute] = time.split(':').map(Number); const wall = Date.UTC(year, month - 1, day, hour, minute, 0); let candidate = wall;
  for (let i = 0; i < 3; i += 1) { const p = partsAt(new Date(candidate), timeZone); candidate += wall - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second); }
  const check = partsAt(new Date(candidate), timeZone);
  return check.year === year && check.month === month && check.day === day && check.hour === hour && check.minute === minute ? new Date(candidate).toISOString() : null;
}
export function parseSafeNaturalReminder(text: string, now = new Date(), timeZone = DEFAULT_TIMEZONE): { title: string; date: string; time: string } | null {
  const match = text.trim().match(/^Маргааш\s+(\d{1,2}):(\d{2})(?:-д|-т|\s)?\s*(.+?)(?:ыг|ийг|г)?\s+сануул[.!]?$/i);
  if (!match) return null;
  const hour = Number(match[1]); const minute = Number(match[2]); if (hour > 23 || minute > 59) return null;
  const p = partsAt(now, timeZone); const tomorrow = new Date(Date.UTC(p.year, p.month - 1, p.day + 1));
  return { title: match[3].trim(), date: tomorrow.toISOString().slice(0, 10), time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
}
