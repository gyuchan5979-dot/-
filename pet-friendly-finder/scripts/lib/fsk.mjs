// 식품안전나라 「반려동물 동반 가능 업소 현황」(식약처, 반려동물 동반출입 음식점 등록 업소)
// https://www.foodsafetykorea.go.kr/portal/petKorea.do
//
// 「식품위생법 시행규칙」 개정(2026.1.2. 공포, 2026.3.1. 시행)으로 지자체에 등록한 음식점 목록이에요.
// 페이지의 표(연번·업소명·업종·지역·업소주소)를 읽고, 주소는 따로 좌표로 바꿔요.

export const FSK_URL = 'https://www.foodsafetykorea.go.kr/portal/petKorea.do';

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

const cellText = (html) => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** 페이지 HTML → [{ no, name, type, region, address }] */
export function parseFskHtml(html) {
  const rows = [];
  for (const [, tr] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => cellText(m[1]));
    if (tds.length === 5 && /^\d+$/.test(tds[0])) {
      const [no, name, type, region, address] = tds;
      rows.push({ no, name, type, region, address });
    }
  }
  return rows;
}

/** "서울특별시 동작구 사당로 304(1층,2층 사당동)" → "서울특별시 동작구 사당로 304" (좌표 검색용) */
export function geocodeQuery(address) {
  return String(address).replace(/\(.*$/, '').replace(/,.*$/, '').trim();
}

/** 업종·이름으로 식당/카페 구분 */
export function fskCategory(row) {
  if (/카페|커피|coffee|cafe|베이커리|bakery|제과|디저트|케이크|cake|빵|도넛|티룸|찻집/i.test(row.name)) return 'cafe';
  if (/휴게음식점|제과점/.test(row.type)) return 'cafe';
  return 'restaurant';
}

/** 같은 이름·주소면 같은 id가 되도록 (연번은 목록이 바뀌면 달라져서 안 써요) */
export function fskId(row) {
  let h = 0;
  for (const ch of `${row.name}|${geocodeQuery(row.address)}`) h = (Math.imul(h, 31) + ch.codePointAt(0)) | 0;
  return `fsk-${(h >>> 0).toString(36)}`;
}

/**
 * 표 한 줄 + 좌표 → Place
 * 동반 조건(크기 등)은 목록에 없어서 "가게에 문의"로 둬요.
 */
export function fskToPlace(row, geo, fetchedAt) {
  if (!geo) return { place: null, reason: 'noGeocode' };
  return {
    place: {
      id: fskId(row),
      name: row.name,
      category: fskCategory(row),
      address: row.address,
      lat: Math.round(geo.lat * 1e6) / 1e6,
      lng: Math.round(geo.lng * 1e6) / 1e6,
      petArea: 'indoor',
      largeDogOk: false,
      amenities: [],
      sizeNote: '가게에 문의',
      restriction: '예방접종을 하지 않은 반려동물은 출입할 수 없어요 (식약처 기준)',
      official: true,
      ...(fetchedAt && { verifiedAt: fetchedAt }),
    },
  };
}
