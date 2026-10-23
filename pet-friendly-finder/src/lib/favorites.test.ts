import { describe, expect, it } from 'vitest';
import { parseFavorites, toggleFavorite } from './favorites';
import type { Place } from '../types';

const place = (id: string): Place => ({
  id, name: id, category: 'cafe', address: '', lat: 37.5, lng: 127, petArea: 'indoor', largeDogOk: false, amenities: [],
});

describe('찜', () => {
  it('추가하면 앞에, 다시 누르면 해제', () => {
    let list = toggleFavorite([], place('a'));
    list = toggleFavorite(list, { ...place('b'), distanceM: 120 } as Place);
    expect(list.map((p) => p.id)).toEqual(['b', 'a']);
    expect('distanceM' in list[0]).toBe(false);
    expect(toggleFavorite(list, place('a')).map((p) => p.id)).toEqual(['b']);
  });

  it('저장값이 깨져 있어도 빈 목록으로 시작', () => {
    expect(parseFavorites('not json')).toEqual([]);
    expect(parseFavorites('{"a":1}')).toEqual([]);
    expect(parseFavorites(JSON.stringify([place('a'), { id: 1 }]))).toHaveLength(1);
  });
});
