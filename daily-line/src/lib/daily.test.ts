import { describe, expect, it } from 'vitest';
import { AUTHORS, LINES } from '../data/lines';
import { addDays, formatDate, isDateKey, lineForDate, pastDays, streak, todayKey } from './daily';

describe('날짜', () => {
  it('한국 시간으로 오늘을 정한다', () => {
    // UTC 10월 23일 15:30 = 한국 10월 24일 00:30
    expect(todayKey(new Date('2026-10-23T15:30:00Z'))).toBe('2026-10-24');
    expect(todayKey(new Date('2026-10-23T14:59:00Z'))).toBe('2026-10-23');
  });

  it('날짜 계산과 형식', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(pastDays('2026-10-24', 3)).toEqual(['2026-10-23', '2026-10-22', '2026-10-21']);
    expect(formatDate('2026-10-24')).toBe('10월 24일 토요일');
    expect(isDateKey('2026-10-24')).toBe(true);
    expect(isDateKey('2026-13-45')).toBe(false);
    expect(isDateKey('어제')).toBe(false);
  });
});

describe('그날의 문장', () => {
  it('같은 날은 같은 문장, 다음 날은 다음 문장', () => {
    const a = lineForDate('2026-10-24');
    expect(lineForDate('2026-10-24')).toBe(a);
    const i = LINES.indexOf(a);
    expect(lineForDate('2026-10-25')).toBe(LINES[(i + 1) % LINES.length]);
    expect(lineForDate(addDays('2026-10-24', LINES.length))).toBe(a);
  });
});

describe('연속 읽기', () => {
  it('오늘까지 이어진 날을 센다', () => {
    expect(streak(['2026-10-22', '2026-10-23', '2026-10-24'], '2026-10-24')).toBe(3);
    // 오늘은 아직 안 읽었어도 어제까지 기록은 이어져 있어요
    expect(streak(['2026-10-22', '2026-10-23'], '2026-10-24')).toBe(2);
    expect(streak(['2026-10-20', '2026-10-24'], '2026-10-24')).toBe(1);
    expect(streak([], '2026-10-24')).toBe(0);
  });
});

describe('문장 모음', () => {
  it('id가 겹치지 않고 빈 칸이 없다', () => {
    expect(new Set(LINES.map((l) => l.id)).size).toBe(LINES.length);
    for (const l of LINES) {
      expect(l.text.trim(), l.id).not.toBe('');
      expect(l.thought.trim(), l.id).not.toBe('');
    }
  });

  it('모든 작가가 저작권 보호기간이 끝났다 (1962년 이전 사망)', () => {
    for (const l of LINES) {
      const died = AUTHORS[l.author];
      expect(died, `${l.author} 사망 연도 없음`).toBeDefined();
      expect(died, l.author).toBeLessThanOrEqual(1962);
    }
  });
});
