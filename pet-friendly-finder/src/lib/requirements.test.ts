import { describe, expect, it } from 'vitest';
import { requirementsOf } from './requirements';

const keys = (restriction?: string) => requirementsOf({ restriction }).map((r) => r.key);

describe('필요사항 칩', () => {
  it('실제 데이터 문구에서 뽑는다', () => {
    expect(keys('목줄 필수, 대형견 입장 불가, 1층 및 야외 테라스 가능')).toEqual(['leash']);
    expect(keys('매너벨트, 4차 접종 필수')).toEqual(['vaccine', 'mannerBelt']);
    expect(keys('맹견, 대형견, 공격성, 짖음, 생리 중인 경우 입장 불가, 입마개, 목줄, 매너벨트 필수')).toEqual([
      'leash',
      'mannerBelt',
      'muzzle',
      'noAggressive',
      'noFierce',
    ]);
    expect(keys('1층은 안고 있어야 함')).toEqual(['hold']);
    expect(keys('예방접종을 하지 않은 반려동물은 출입할 수 없어요 (식약처 기준)')).toEqual(['vaccine']);
  });

  it('제한사항이 없으면 빈 목록', () => {
    expect(keys(undefined)).toEqual([]);
    expect(keys('야외테라스만 동반 가능')).toEqual([]);
  });
});
