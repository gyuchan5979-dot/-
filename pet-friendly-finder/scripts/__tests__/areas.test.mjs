import { describe, expect, it } from 'vitest';
import { buildSearchIndex, parseArea } from '../lib/areas.mjs';

describe('주소에서 동네 뽑기', () => {
  it('실제 주소 형식들', () => {
    expect(parseArea('서울특별시 성동구 성수이로14길 14(주대명케미칼 나동 2층 성수동2가)')).toEqual({ sido: '서울', sigungu: '성동구', dong: '성수동' });
    expect(parseArea('서울특별시 성동구 왕십리로 1', '성수1가동')).toEqual({ sido: '서울', sigungu: '성동구', dong: '성수동' });
    expect(parseArea('경기도 남양주시 진접읍 장현로 1')).toEqual({ sido: '경기', sigungu: '남양주시', dong: '진접읍' });
    expect(parseArea('전북특별자치도 전주시 완산구 백제대로 412(1층 서신동)')).toEqual({ sido: '전북', sigungu: '전주시 완산구', dong: '서신동' });
    expect(parseArea('전남광주통합특별시 남구 봉선1로 52(1층 봉선동)')).toEqual({ sido: '전남광주', sigungu: '남구', dong: '봉선동' });
    expect(parseArea('제주특별자치도 제주시 한경면 낙원로 93(1층)')).toEqual({ sido: '제주', sigungu: '제주시', dong: '한경면' });
    expect(parseArea('세종특별자치시 한누리대로 1')).toEqual({ sido: '세종', sigungu: '세종' });
    expect(parseArea('강원도 속초시 관광로 250-20', '대포동')).toEqual({ sido: '강원', sigungu: '속초시', dong: '대포동' });
    expect(parseArea('주소 없음')).toBeNull();
  });

  it('동네 중심은 가게 위치 평균, 많은 순', () => {
    const p = (id, address, lat, lng) => ({ id, name: id, address, lat, lng });
    const { areas, places } = buildSearchIndex([
      p('a', '서울특별시 성동구 성수이로 1(1층 성수동1가)', 37.54, 127.05),
      p('b', '서울특별시 성동구 성수이로 2(1층 성수동2가)', 37.56, 127.07),
      p('c', '서울특별시 마포구 와우산로 1(1층 서교동)', 37.55, 126.92),
    ]);
    expect(areas[0]).toEqual({ label: '서울 성동구', lat: 37.55, lng: 127.06, count: 2 });
    expect(areas.map((a) => a.label)).toContain('서울 성동구 성수동');
    expect(places[2]).toEqual(['c', 'c', '서울 마포구', 37.55, 126.92]);
  });
});
