import { describe, expect, it } from 'vitest';
import { fskCategory, fskId, fskToPlace, geocodeQuery, parseFskHtml } from '../lib/fsk.mjs';
import { geocodeKakao, geocodeNominatim, isPreciseNominatim } from '../lib/geocode.mjs';

// 식품안전나라 페이지 표 구조를 줄인 가상 HTML이에요.
const HTML = `
<table><thead><tr><th>연번</th><th>업소명</th><th>업종</th><th>지역</th><th>업소주소</th></tr></thead>
<tbody>
<tr><td>1</td><td>(주)커피 리브레</td><td>일반음식점</td><td>서울</td><td>서울특별시 마포구 성미산로29길 17-8(1,2,지1층 연남동)</td></tr>
<tr><td>2</td><td>테스트 &amp; 고깃집</td><td>일반음식점</td><td>경기</td><td>경기도 남양주시 불암로 307(2층 별내동)</td></tr>
<tr><td>3</td><td>동네빵집</td><td>제과점영업</td><td>부산</td><td>부산광역시 해운대구 해운대로 1</td></tr>
</tbody></table>`;

describe('식약처 업소 현황', () => {
  it('표를 읽는다', () => {
    const rows = parseFskHtml(HTML);
    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual({ no: '2', name: '테스트 & 고깃집', type: '일반음식점', region: '경기', address: '경기도 남양주시 불암로 307(2층 별내동)' });
  });

  it('괄호 속 층·동 정보를 빼고 좌표를 찾는다', () => {
    expect(geocodeQuery('서울특별시 마포구 성미산로29길 17-8(1,2,지1층 연남동)')).toBe('서울특별시 마포구 성미산로29길 17-8');
  });

  it('업종·이름으로 식당/카페 구분', () => {
    const [coffee, meat, bakery] = parseFskHtml(HTML);
    expect(fskCategory(coffee)).toBe('cafe');
    expect(fskCategory(meat)).toBe('restaurant');
    expect(fskCategory(bakery)).toBe('cafe');
  });

  it('id는 연번이 아니라 이름·주소로 정해진다', () => {
    const [a] = parseFskHtml(HTML);
    expect(fskId({ ...a, no: '999' })).toBe(fskId(a));
  });

  it('좌표가 없으면 제외, 있으면 식약처 등록 표시', () => {
    const [row] = parseFskHtml(HTML);
    expect(fskToPlace(row, null).reason).toBe('noGeocode');
    expect(fskToPlace(row, { lat: 37.5612345678, lng: 126.92 }, '2026-10-11').place).toMatchObject({
      official: true,
      lat: 37.561235,
      verifiedAt: '2026-10-11',
    });
  });
});

describe('좌표 변환', () => {
  it('Nominatim은 번지·건물까지 맞은 결과만 쓴다', () => {
    expect(isPreciseNominatim({ addresstype: 'road', address: {} })).toBe(false);
    expect(isPreciseNominatim({ addresstype: 'road', address: { house_number: '607' } })).toBe(true);
    expect(isPreciseNominatim({ addresstype: 'building', address: {} })).toBe(true);
    expect(isPreciseNominatim(undefined)).toBe(false);
  });

  it('Nominatim 응답 처리', async () => {
    const fake = (body) => async () => ({ ok: true, json: async () => body });
    expect(await geocodeNominatim('q', fake([{ lat: '37.5', lon: '127.0', addresstype: 'building', address: {} }]))).toEqual({
      lat: 37.5,
      lng: 127,
      by: 'nominatim',
    });
    expect(await geocodeNominatim('q', fake([{ lat: '37.5', lon: '127.0', addresstype: 'road', address: {} }]))).toBeNull();
    expect(await geocodeNominatim('q', fake([]))).toBeNull();
  });

  it('카카오는 도로명·번지 주소까지 맞은 결과만 쓴다', async () => {
    const fake = (documents) => async () => ({ ok: true, json: async () => ({ documents }) });
    expect(await geocodeKakao('q', 'k', fake([{ address_type: 'ROAD_ADDR', x: '127.1', y: '37.6' }]))).toEqual({
      lat: 37.6,
      lng: 127.1,
      by: 'kakao',
    });
    expect(await geocodeKakao('q', 'k', fake([{ address_type: 'REGION', x: '127.1', y: '37.6' }]))).toBeNull();
  });
});
