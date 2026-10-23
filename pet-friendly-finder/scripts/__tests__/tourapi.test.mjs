import { describe, expect, it } from 'vitest';
import { mergeSources } from '../lib/grid.mjs';
import { assertOk, extractItems, tourPetArea, tourToPlace } from '../lib/tourapi.mjs';

// 명세(Swagger)의 필드 이름을 따른 가상 응답이에요.
const item = (o = {}) => ({
  contentid: '100', contenttypeid: '39', title: '테스트 식당', addr1: '서울특별시 중구 세종대로 110', addr2: '1층',
  mapx: '126.978', mapy: '37.5665', cat3: 'A05020100', tel: '02-000-0000', modifiedtime: '20250910123000', ...o,
});
const detail = (o = {}) => ({
  contentid: '100', acmpyTypeCd: '전구역 동반가능', acmpyPsblCpam: '모든 견종 동반 가능', acmpyNeedMtr: '목줄 착용',
  relaPosesFclty: '펫 의자, 물그릇', relaFrnshPrdlst: '배변봉투', ...o,
});

describe('TourAPI 응답 처리', () => {
  it('items가 빈 문자열이거나 1건 객체여도 배열로 꺼낸다', () => {
    expect(extractItems({ response: { body: { items: '' } } })).toEqual([]);
    expect(extractItems({ response: { body: { items: { item: { a: 1 } } } } })).toEqual([{ a: 1 }]);
    expect(extractItems({ response: { body: { items: { item: [{ a: 1 }, { a: 2 }] } } } })).toHaveLength(2);
  });

  it('키 오류 응답이면 에러', () => {
    expect(() =>
      assertOk({ OpenAPI_ServiceResponse: { cmmMsgHeader: { errMsg: 'SERVICE_KEY_IS_NULL', returnAuthMsg: '서비스 접근거부', returnReasonCode: '20' } } }),
    ).toThrow(/20/);
    expect(() => assertOk({ response: { header: { resultCode: '0000', resultMsg: 'OK' } } })).not.toThrow();
  });

  it('음식점 + 반려동물 상세 → Place', () => {
    const { place } = tourToPlace(item(), detail());
    expect(place).toEqual({
      id: 'tour-100', name: '테스트 식당', category: 'restaurant', address: '서울특별시 중구 세종대로 110 1층',
      lat: 37.5665, lng: 126.978, petArea: 'indoor', largeDogOk: true, amenities: ['펫 의자', '물그릇', '배변봉투'],
      sizeNote: '모든 견종 동반 가능', restriction: '목줄 착용', phone: '02-000-0000', verifiedAt: '2025-09-10',
    });
  });

  it('카페 분류, 크기 제한, 동반 불가, 상세 없음', () => {
    expect(tourToPlace(item({ cat3: 'A05020900' }), detail()).place.category).toBe('cafe');
    expect(tourToPlace(item(), detail({ acmpyPsblCpam: '5kg 이하 동반 가능(이동장 이용 필수)' })).place).toMatchObject({
      largeDogOk: false,
      petArea: 'carrier',
    });
    expect(tourToPlace(item(), detail({ acmpyPsblCpam: '대형견 제외 동반 가능' })).place.largeDogOk).toBe(false);
    expect(tourToPlace(item(), detail({ acmpyTypeCd: '동반불가' })).reason).toBe('notAllowed');
    expect(tourToPlace(item(), null).reason).toBe('noPetInfo');
    expect(tourToPlace(item({ contenttypeid: '12' }), detail()).reason).toBe('category');
  });

  it('동반 범위', () => {
    expect(tourPetArea({ acmpyTypeCd: '일부구역 동반가능' })).toBe('partial');
    expect(tourPetArea({ acmpyTypeCd: '일부구역 동반가능', acmpyNeedMtr: '야외 테라스만 가능' })).toBe('terrace');
    expect(tourPetArea({})).toBe('unknown');
  });
});

describe('출처 합치기', () => {
  const p = (name, lat, lng) => ({ name, lat, lng });

  it('80m 안의 같은 이름은 우선순위가 높은 출처만 남긴다', () => {
    const { places, duplicates } = mergeSources([
      { name: 'tourapi', places: [p('카페 구할구 남산', 37.56, 126.99)] },
      { name: 'kcisa', places: [p('카페구할구 남산', 37.5603, 126.9901), p('다른카페', 37.56, 126.99), p('카페 구할구 남산', 37.6, 126.99)] },
    ]);
    expect(duplicates).toBe(1);
    expect(places.map((x) => `${x.source}:${x.name}`)).toEqual([
      'tourapi:카페 구할구 남산',
      'kcisa:다른카페',
      'kcisa:카페 구할구 남산',
    ]);
  });
});

describe('같은 가게 정보 채우기', () => {
  it('식약처 업소의 빈 칸을 다른 출처 정보로 채운다', async () => {
    const { mergeSources } = await import('../lib/grid.mjs');
    const fsk = { name: '사직커피', lat: 37.5757, lng: 126.9688, largeDogOk: false, sizeNote: '가게에 문의', restriction: '예방접종 필수', amenities: [] };
    const kcisa = { name: '사직커피', lat: 37.5758, lng: 126.9689, largeDogOk: true, sizeNote: '모두 가능', restriction: '목줄 필수', phone: '02-000-0000', hours: '매일 10:00~20:00', closedDays: '연중무휴', parking: false, amenities: [] };
    const { places } = mergeSources([{ name: 'fsk', places: [fsk] }, { name: 'kcisa', places: [kcisa] }]);
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      source: 'fsk', phone: '02-000-0000', hours: '매일 10:00~20:00', closedDays: '연중무휴', parking: false,
      sizeNote: '모두 가능', largeDogOk: true, restriction: '목줄 필수 · 예방접종 필수',
    });
  });
});
