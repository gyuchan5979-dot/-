// 주소 → 좌표 변환
//
// - 카카오 로컬 주소 검색 (KAKAO_REST_KEY 있으면 사용, 가장 정확)
// - OSM Nominatim (키 없이 사용, 초당 1회 제한). 도로 전체처럼 부정확한 결과는 버려요.

const NOMINATIM_UA = 'pet-friendly-finder/0.1 (Apps in Toss mini-app; contact: repository owner)';

/**
 * Nominatim 결과 중 번지·건물까지 맞은 것만 정확하다고 봐요.
 * "올림픽로 607"이 "올림픽로" 전체로 잡히면 몇 km씩 틀어질 수 있어서요.
 */
export function isPreciseNominatim(hit) {
  if (!hit) return false;
  if (hit.address?.house_number) return true;
  return ['building', 'amenity', 'shop', 'house', 'tourism', 'leisure', 'office', 'craft'].includes(hit.addresstype);
}

export async function geocodeNominatim(query, fetchImpl = fetch) {
  const qs = new URLSearchParams({ q: query, format: 'jsonv2', addressdetails: '1', limit: '1', countrycodes: 'kr' });
  const res = await fetchImpl(`https://nominatim.openstreetmap.org/search?${qs}`, {
    headers: { 'User-Agent': NOMINATIM_UA, 'Accept-Language': 'ko' },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const [hit] = await res.json();
  if (!isPreciseNominatim(hit)) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon), by: 'nominatim' };
}

export async function geocodeKakao(query, key, fetchImpl = fetch) {
  const res = await fetchImpl(`https://dapi.kakao.com/v2/local/search/address.json?${new URLSearchParams({ query })}`, {
    headers: { Authorization: `KakaoAK ${key}` },
  });
  if (!res.ok) throw new Error(`Kakao ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const { documents } = await res.json();
  const doc = documents?.[0];
  // 도로명/지번 주소까지 맞은 결과만 (REGION = 동네 단위라 부정확)
  if (!doc || !['ROAD_ADDR', 'REGION_ADDR'].includes(doc.address_type)) return null;
  if (doc.address_type === 'REGION_ADDR' && !doc.address?.main_address_no) return null;
  return { lat: Number(doc.y), lng: Number(doc.x), by: 'kakao' };
}
