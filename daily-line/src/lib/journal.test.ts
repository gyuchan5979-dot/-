import { describe, expect, it } from 'vitest';
import { EMPTY, isUnlocked, markOpened, markVisited, parseJournal, toggleSaved } from './journal';

describe('읽기 기록', () => {
  it('깨진 저장값은 빈 기록으로 읽는다', () => {
    expect(parseJournal(null)).toEqual(EMPTY);
    expect(parseJournal('{oops')).toEqual(EMPTY);
    expect(parseJournal('{"visits":["2026-10-24",3],"saved":"x"}')).toEqual({ visits: ['2026-10-24'], opened: [], saved: [] });
  });

  it('읽은 날·연 날은 한 번만, 날짜순으로 쌓인다', () => {
    let j = markVisited(EMPTY, '2026-10-24');
    j = markVisited(j, '2026-10-22');
    expect(markVisited(j, '2026-10-24')).toBe(j);
    expect(j.visits).toEqual(['2026-10-22', '2026-10-24']);
    j = markOpened(j, '2026-10-23');
    expect(isUnlocked(j, '2026-10-23')).toBe(true);
    expect(isUnlocked(j, '2026-10-21')).toBe(false);
  });

  it('간직하기는 누를 때마다 넣고 빼고, 최근 것이 앞에 온다', () => {
    let j = toggleSaved(EMPTY, 'a');
    j = toggleSaved(j, 'b');
    expect(j.saved).toEqual(['b', 'a']);
    expect(toggleSaved(j, 'a').saved).toEqual(['b']);
  });
});
