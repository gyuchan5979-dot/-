import { useCallback, useEffect, useState } from 'react';
import { readItem, writeItem } from './storage';

// 기기에만 저장하는 읽기 기록
// - visits: 앱을 열어 그날의 문장을 읽은 날
// - opened: 지난 날 중 따로 열어 본 날 (광고 보고 열기)
// - saved: 간직한 문장 id (최근 것이 앞)

export interface Journal {
  visits: string[];
  opened: string[];
  saved: string[];
}

const KEY = 'journal.v1';
/** 기록이 끝없이 커지지 않게 최근 것만 남겨요 */
const MAX_DAYS = 400;

export const EMPTY: Journal = { visits: [], opened: [], saved: [] };

export function parseJournal(raw: string | null): Journal {
  try {
    const j = JSON.parse(raw ?? '');
    const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
    return { visits: list(j?.visits), opened: list(j?.opened), saved: list(j?.saved) };
  } catch {
    return EMPTY;
  }
}

const addDay = (days: string[], day: string) => (days.includes(day) ? days : [...days, day].sort().slice(-MAX_DAYS));

export function markVisited(j: Journal, day: string): Journal {
  return j.visits.includes(day) ? j : { ...j, visits: addDay(j.visits, day) };
}

export function markOpened(j: Journal, day: string): Journal {
  return j.opened.includes(day) ? j : { ...j, opened: addDay(j.opened, day) };
}

export function toggleSaved(j: Journal, id: string): Journal {
  return { ...j, saved: j.saved.includes(id) ? j.saved.filter((x) => x !== id) : [id, ...j.saved] };
}

/** 그날 문장을 볼 수 있는지: 그날 읽었거나 따로 열었거나 */
export function isUnlocked(j: Journal, day: string): boolean {
  return j.visits.includes(day) || j.opened.includes(day);
}

export function useJournal(today: string) {
  const [journal, setJournal] = useState<Journal | null>(null);

  useEffect(() => {
    let cancelled = false;
    readItem(KEY).then((raw) => {
      if (cancelled) return;
      const next = markVisited(parseJournal(raw), today);
      setJournal(next);
      void writeItem(KEY, JSON.stringify(next));
    });
    return () => {
      cancelled = true;
    };
  }, [today]);

  const update = useCallback((fn: (j: Journal) => Journal) => {
    setJournal((prev) => {
      const next = fn(prev ?? EMPTY);
      void writeItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { journal, update };
}
