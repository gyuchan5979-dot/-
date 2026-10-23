import type { Coords } from '../types';

// 동네·가게 이름 검색. 데이터 빌드 때 만든 public/places/search.json을 처음 검색할 때 한 번 받아요.

export interface AreaHit {
  label: string;
  coords: Coords;
  count: number;
}

export interface PlaceHit {
  id: string;
  name: string;
  where: string;
  coords: Coords;
}

interface SearchIndex {
  areas: { label: string; lat: number; lng: number; count: number }[];
  places: [string, string, string, number, number][];
}

let indexPromise: Promise<SearchIndex | null> | null = null;

export function loadSearchIndex(): Promise<SearchIndex | null> {
  indexPromise ??= fetch(`${import.meta.env.BASE_URL}places/search.json`)
    .then((res) => (res.ok ? (res.json() as Promise<SearchIndex>) : null))
    .catch(() => null);
  return indexPromise;
}

const squash = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/** 검색어를 띄어쓰기로 나눠 모두 포함하는지 봐요. ("서울 성수" → 서울·성수 둘 다) */
function tokensOf(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function searchIndex(index: SearchIndex, query: string, limit = 6): { areas: AreaHit[]; places: PlaceHit[] } {
  const tokens = tokensOf(query);
  if (tokens.length === 0) return { areas: [], places: [] };

  const areas = index.areas
    .filter((a) => tokens.every((t) => squash(a.label).includes(t)))
    .map((a) => {
      const last = a.label.split(' ').pop() ?? '';
      // 마지막 단어(동네 이름)가 검색어로 시작하면 위로
      const starts = tokens.some((t) => last.toLowerCase().startsWith(t));
      return { a, score: (starts ? 1_000_000 : 0) + a.count };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(({ a }) => ({ label: a.label, coords: { lat: a.lat, lng: a.lng }, count: a.count }));

  const places = index.places
    .filter(([, name, where]) => tokens.every((t) => squash(name).includes(t) || squash(where).includes(t)))
    .filter(([, name]) => tokens.some((t) => squash(name).includes(t)))
    .sort(([, a], [, b]) => Number(squash(b).startsWith(tokens[0])) - Number(squash(a).startsWith(tokens[0])))
    .slice(0, limit)
    .map(([id, name, where, lat, lng]) => ({ id, name, where, coords: { lat, lng } }));

  return { areas, places };
}

/** 화면에 보일 짧은 지역 이름: "서울 성동구 성수동" → "성수동", "서울 송파구" → "서울 송파구" */
export function shortAreaLabel(label: string): string {
  const parts = label.split(' ');
  return parts.length >= 3 ? parts[parts.length - 1] : label;
}
