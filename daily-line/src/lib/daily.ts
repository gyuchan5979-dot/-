import { LINES, type Line } from '../data/lines';

// 날짜는 모두 한국 시간 기준 'YYYY-MM-DD' 문자열로 다뤄요.
// 같은 날에는 누구에게나 같은 문장이 나와서, 친구에게 "오늘의 한 줄"을 공유할 수 있어요.

const DAY_MS = 24 * 60 * 60 * 1000;

/** 한국 시간 기준 오늘 날짜 */
export function todayKey(now: Date = new Date()): string {
  // en-CA 형식이 YYYY-MM-DD예요.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);
}

export function isDateKey(s: string | null | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

function dayNumber(key: string): number {
  return Math.floor(Date.parse(`${key}T00:00:00Z`) / DAY_MS);
}

export function addDays(key: string, n: number): string {
  return new Date((dayNumber(key) + n) * DAY_MS).toISOString().slice(0, 10);
}

/** 그날의 문장. 날짜 순서대로 목록을 한 바퀴씩 돌아요. */
export function lineForDate(key: string, lines: Line[] = LINES): Line {
  const n = lines.length;
  return lines[((dayNumber(key) % n) + n) % n];
}

/** 오늘을 포함해 연속으로 읽은 날 수. 오늘 아직 안 읽었으면 어제까지 이어진 기록을 세요. */
export function streak(visits: Iterable<string>, today: string): number {
  const set = new Set(visits);
  let day = set.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

/** 어제부터 거꾸로 n일 */
export function pastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, -(i + 1)));
}

/** "10월 24일 금요일" */
export function formatDate(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'UTC' }).format(d);
}
