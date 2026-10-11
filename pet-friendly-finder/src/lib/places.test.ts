import { describe, expect, it } from 'vitest';
import { cellsAround } from './places';

describe('cellsAround', () => {
  it('반경이 격자 안에만 있으면 한 칸', () => {
    expect(cellsAround({ lat: 37.55, lng: 126.95 }, 1000, 0.1)).toEqual(['375_1269']);
  });

  it('격자 경계 근처면 이웃 칸까지 포함', () => {
    const keys = cellsAround({ lat: 37.5, lng: 127.0 }, 3000, 0.1);
    expect(keys).toEqual(expect.arrayContaining(['374_1269', '374_1270', '375_1269', '375_1270']));
  });
});
