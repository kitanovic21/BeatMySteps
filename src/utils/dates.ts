// All dates are handled in the device's local time zone. A "day key" is YYYY-MM-DD.

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Monday-first
export const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAYS_LETTER = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type Period = 'day' | 'week' | 'month' | 'year';

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toKey(a) === toKey(b);
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000) + 1;
}

export function eachDay(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  for (let d = startOfDay(from); d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export interface Range {
  start: Date;
  end: Date;
}

/** Range of a period shifted by `offset` periods from the one containing `ref`. */
export function periodRange(period: Period, offset = 0, ref = new Date()): Range {
  switch (period) {
    case 'day': {
      const d = addDays(ref, offset);
      return { start: startOfDay(d), end: startOfDay(d) };
    }
    case 'week': {
      const start = addDays(ref, -weekdayIndex(ref) + offset * 7);
      return { start, end: addDays(start, 6) };
    }
    case 'month': {
      const start = new Date(ref.getFullYear(), ref.getMonth() + offset, 1);
      return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 0) };
    }
    case 'year': {
      const y = ref.getFullYear() + offset;
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
    }
  }
}

/** The part of a range that is not in the future (end clamped to today). */
export function elapsed(range: Range, today = new Date()): Range | null {
  const t = startOfDay(today);
  if (range.start > t) return null;
  return { start: range.start, end: range.end > t ? t : range.end };
}

export function formatRange(period: Period, range: Range): string {
  const { start, end } = range;
  switch (period) {
    case 'day':
      return formatLongDate(start);
    case 'week':
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
      }
      return `${formatShortDate(start)} – ${formatShortDate(end)}, ${end.getFullYear()}`;
    case 'month':
      return `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    case 'year':
      return String(start.getFullYear());
  }
}

export function formatLongDate(d: Date): string {
  return `${WEEKDAYS_LONG[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatShortDate(d: Date): string {
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** "just now", "5m", "3h", "2d", then a short date */
export function formatTimeAgo(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const mins = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatShortDate(d);
}
