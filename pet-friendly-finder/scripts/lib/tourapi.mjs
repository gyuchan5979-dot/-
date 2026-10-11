// 한국관광공사 「반려동물 동반여행 서비스」(KorPetTourService2) 응답을 Place로 바꾸는 순수 함수들이에요.
// 명세: https://www.data.go.kr/data/15135102/openapi.do

import { largeDogAllowed, normalizeDate } from './transform.mjs';

export const BASE_URL = 'https://apis.data.go.kr/B551011/KorPetTourService2';

/** 음식점 관광타입 */
export const CONTENT_TYPE_FOOD = '39';

/** TourAPI 소분류 코드: 카페/전통찻집 */
const CAT3_CAFE = 'A05020900';

/**
 * 응답에서 item 배열 꺼내기.
 * 결과가 없으면 items가 빈 문자열("")로 오고, 1건이면 배열이 아니라 객체로 오는 경우가 있어요.
 */
export function extractItems(json) {
  const body = json?.response?.body ?? json?.body;
  const item = body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

/** 응답 헤더 확인. 실패면 에러를 던져요. */
export function assertOk(json) {
  const header = json?.response?.header ?? json?.header;
  if (header && header.resultCode !== '0000') {
    throw new Error(`TourAPI 오류 ${header.resultCode}: ${header.resultMsg}`);
  }
  // 키 오류 등은 OpenAPI_ServiceResponse 형식으로 와요.
  const cmm = json?.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (cmm) throw new Error(`TourAPI 오류 ${cmm.returnReasonCode}: ${cmm.returnAuthMsg} (${cmm.errMsg})`);
}

export function totalCount(json) {
  return Number((json?.response?.body ?? json?.body)?.totalCount ?? 0);
}

const text = (v) => {
  const s = String(v ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
  return s && !/^(없음|해당없음|-)$/.test(s) ? s : undefined;
};

/** "물그릇, 배변봉투 / 리드줄" → ['물그릇', '배변봉투', '리드줄'] (최대 4개) */
function splitList(...values) {
  return values
    .flatMap((v) => String(v ?? '').split(/[,/·\n]|<br\s*\/?>/i))
    .map((s) => s.trim())
    .filter((s) => s && s.length <= 15 && !/^(없음|해당없음|-)$/.test(s))
    .slice(0, 4);
}

/** 동반유형(자유 텍스트) + 필요사항으로 동반 범위 판단 */
export function tourPetArea(detail) {
  const all = [detail.acmpyTypeCd, detail.acmpyNeedMtr, detail.etcAcmpyInfo, detail.acmpyPsblCpam].join(' ');
  if (/케이지|이동장|이동가방|캐리어|안고/.test(all)) return 'carrier';
  if (/(실외|야외|테라스)[^,]*만/.test(all)) return 'terrace';
  if (/일부/.test(String(detail.acmpyTypeCd ?? ''))) return 'partial';
  if (/전\s*구역|전체/.test(String(detail.acmpyTypeCd ?? ''))) return 'indoor';
  return 'unknown';
}

/** 동반 불가로 적힌 곳인지 */
export function tourNotAllowed(detail) {
  return /동반\s*불가|불가능/.test(String(detail.acmpyTypeCd ?? ''));
}

/**
 * 목록 item + 반려동물 상세 → Place.
 * @returns {{ place: object | null, reason?: string }}
 */
export function tourToPlace(item, detail) {
  if (String(item.contenttypeid) !== CONTENT_TYPE_FOOD) return { place: null, reason: 'category' };
  if (!detail) return { place: null, reason: 'noPetInfo' };
  if (tourNotAllowed(detail)) return { place: null, reason: 'notAllowed' };

  const lat = Number(item.mapy);
  const lng = Number(item.mapx);
  if (!(lat > 33 && lat < 39 && lng > 124 && lng < 132)) return { place: null, reason: 'coords' };

  const name = text(item.title);
  if (!name) return { place: null, reason: 'name' };

  const cafe = item.cat3 === CAT3_CAFE || /카페|커피|베이커리|찻집/.test(name);
  const sizeNote = text(detail.acmpyPsblCpam);
  const restriction = text(detail.acmpyNeedMtr);
  const amenities = splitList(detail.relaPosesFclty, detail.relaFrnshPrdlst);

  return {
    place: {
      id: `tour-${item.contentid}`,
      name,
      category: cafe ? 'cafe' : 'restaurant',
      address: [text(item.addr1), text(item.addr2)].filter(Boolean).join(' '),
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
      petArea: tourPetArea(detail),
      largeDogOk: largeDogAllowed(sizeNote, restriction),
      amenities,
      ...(sizeNote && { sizeNote }),
      ...(restriction && { restriction }),
      ...(text(item.tel) && { phone: text(item.tel) }),
      ...(normalizeDate(item.modifiedtime) && { verifiedAt: normalizeDate(item.modifiedtime) }),
    },
  };
}
