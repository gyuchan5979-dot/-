import { describe, expect, it } from 'vitest';
import { searchIndex, shortAreaLabel } from './search';

const index = {
  areas: [
    { label: '서울 송파구', lat: 37.5, lng: 127.1, count: 40 },
    { label: '서울 성동구', lat: 37.55, lng: 127.04, count: 30 },
    { label: '서울 성동구 성수동', lat: 37.54, lng: 127.05, count: 20 },
    { label: '경기 남양주시 진접읍', lat: 37.72, lng: 127.19, count: 5 },
  ],
  places: [
    ['p1', '성수 멍카페', '서울 성동구', 37.54, 127.05],
    ['p2', '송파 브런치', '서울 송파구', 37.5, 127.1],
    ['p3', '카페 성수점', '부산 해운대구', 35.16, 129.16],
  ] as [string, string, string, number, number][],
};

describe('검색', () => {
  it('동네 이름으로 찾고, 동네 이름이 검색어로 시작하는 걸 먼저', () => {
    expect(searchIndex(index, '성수').areas.map((a) => a.label)).toEqual(['서울 성동구 성수동']);
    expect(searchIndex(index, '성').areas.map((a) => a.label)).toEqual(['서울 성동구', '서울 성동구 성수동']);
    expect(searchIndex(index, '진접').areas[0]).toMatchObject({ label: '경기 남양주시 진접읍', count: 5 });
  });

  it('띄어쓰기로 나눈 말을 모두 포함해야 해요', () => {
    expect(searchIndex(index, '서울 성수').areas.map((a) => a.label)).toEqual(['서울 성동구 성수동']);
    expect(searchIndex(index, '서울 성수').places.map((p) => p.id)).toEqual(['p1']);
  });

  it('가게 이름 검색, 이름이 검색어로 시작하는 걸 먼저', () => {
    expect(searchIndex(index, '성수').places.map((p) => p.id)).toEqual(['p1', 'p3']);
    expect(searchIndex(index, '   ').places).toEqual([]);
  });

  it('짧은 지역 이름', () => {
    expect(shortAreaLabel('서울 성동구 성수동')).toBe('성수동');
    expect(shortAreaLabel('서울 송파구')).toBe('서울 송파구');
  });
});
