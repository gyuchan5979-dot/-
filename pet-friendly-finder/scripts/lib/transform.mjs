// 「한국문화정보원_전국 반려동물 동반 가능 문화시설 위치 데이터」 CSV 한 줄을
// 앱의 Place 형식으로 바꾸는 순수 함수들이에요. (scripts/convert-places.mjs에서 사용)

/** 지도 데이터를 나누는 격자 크기(도). 0.1도 ≈ 위도 11km */
export const CELL_SIZE = 0.1;

const normalize = (s) => String(s ?? '').replace(/[\s_()（）]/g, '').toLowerCase();

/**
 * 컬럼명이 배포 시점마다 띄어쓰기·괄호가 조금씩 달라서,
 * 공백·괄호를 뺀 이름으로 맞춰 찾아요.
 */
const COLUMN_CANDIDATES = {
  name: ['시설명'],
  cat1: ['카테고리1'],
  cat2: ['카테고리2'],
  cat3: ['카테고리3'],
  lat: ['위도'],
  lng: ['경도'],
  roadAddress: ['도로명주소'],
  jibunAddress: ['지번주소'],
  phone: ['전화번호'],
  petAllowed: ['반려동물동반가능정보', '반려동물동반가능여부'],
  sizeAllowed: ['입장가능동물크기'],
  restriction: ['반려동물제한사항'],
  indoor: ['장소실내여부'],
  outdoor: ['장소실외여부'],
  updatedAt: ['최종작성일'],
};

/** CSV 헤더 → { 필드: 컬럼 인덱스 } */
export function resolveColumns(header) {
  const normalized = header.map(normalize);
  const columns = {};
  for (const [field, candidates] of Object.entries(COLUMN_CANDIDATES)) {
    const idx = normalized.findIndex((h) => candidates.some((c) => h === normalize(c)));
    if (idx >= 0) columns[field] = idx;
  }
  const required = ['name', 'lat', 'lng'];
  const missing = required.filter((f) => columns[f] === undefined);
  if (missing.length > 0) {
    const names = missing.map((f) => COLUMN_CANDIDATES[f][0]).join(', ');
    throw new Error(`필수 컬럼을 찾지 못했어요: ${names}\n헤더: ${header.join(' | ')}`);
  }
  return columns;
}

const yes = (v) => /^(y|yes|예|가능|o|true|1)$/i.test(String(v ?? '').trim());
const no = (v) => /^(n|no|아니오|불가|불가능|x|false|0)$/i.test(String(v ?? '').trim());

/** 카테고리 문자열로 식당/카페 구분. 둘 다 아니면 null */
export function classify(categoryText) {
  if (/카페|커피|베이커리|디저트|제과/.test(categoryText)) return 'cafe';
  if (/식당|음식|레스토랑|맛집|요리/.test(categoryText)) return 'restaurant';
  return null;
}

/**
 * 고양이·라쿤 카페처럼 동물을 보러 가는 곳인지.
 * 원본에 "반려동물 동반 가능"으로 들어가 있지만 강아지를 데려갈 곳은 아니라서 빼요.
 * 이름에 강아지 관련 단어도 있으면(예: "냥냥댕댕") 남겨요.
 */
export function isAnimalCafe(name) {
  const s = String(name ?? '');
  return /고양이|캣|(?<![a-z])cats?(?![a-z])|냥|냐옹|야옹|라쿤|미어캣|애니멀고/i.test(s) && !/댕|강아지|반려견|애견|멍|도그|dog|퍼피/i.test(s);
}

/**
 * 「입장 가능 동물 크기」·「반려동물 제한사항」으로 대형견 입장 가능 여부 판단.
 * 예: "모두 가능" → true, "15kg 미만" / "소형/중형" → false
 */
export function largeDogAllowed(sizeText, restriction = '') {
  const s = String(sizeText ?? '').replace(/\s/g, '');
  if (!s) return false;
  if (/대형견[^,]*(불가|제한)/.test(String(restriction ?? ''))) return false;
  if (/대형[^,]*(불가|제외|제한)/.test(s)) return false;
  if (/모두|모든|전체|제한없|대형/.test(s)) return true;
  const kg = s.match(/(\d+(?:\.\d+)?)kg/i);
  // 대략 25kg 이상까지 허용하면 대형견도 가능하다고 봐요.
  if (kg) return Number(kg[1]) >= 25;
  return false;
}

/**
 * 실내/실외 여부와 제한사항 문구로 동반 범위 판단.
 * 원본의 「장소(실내) 여부」는 거의 다 Y라서, 제한사항 문구를 먼저 봐요.
 */
export function petArea({ indoor, outdoor, restriction }) {
  const r = String(restriction ?? '');
  if (/케이지|이동장|이동가방|캐리어|가방|안고/.test(r)) return 'carrier';
  if (/(실외|야외|테라스)[^,]*만/.test(r)) return 'terrace';
  if (yes(indoor)) return 'indoor';
  if (yes(outdoor)) return 'terrace';
  return 'unknown';
}

/** "2023-01-31", "20230131", "2023.01.31" → "2023-01-31" */
export function normalizeDate(v) {
  const digits = String(v ?? '').replace(/\D/g, '');
  if (digits.length < 8) return undefined;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

const clean = (v) => {
  const s = String(v ?? '').trim();
  return s && !/^(정보없음|없음|해당없음|제한사항없음|-|null)$/i.test(s.replace(/\s/g, '')) ? s : undefined;
};

/**
 * CSV 한 줄 → Place. 식당·카페가 아니거나, 동반 불가이거나, 좌표가 이상하면 null.
 * @returns {{ place: object | null, reason?: string }}
 */
export function toPlace(row, columns, index) {
  const get = (field) => (columns[field] === undefined ? undefined : row[columns[field]]);

  // 카테고리2가 "반려동물식당카페"처럼 둘 다 담고 있어서, 가장 구체적인 카테고리3부터 봐요.
  const category = classify(String(get('cat3') ?? '')) ?? classify(String(get('cat2') ?? ''));
  if (!category) return { place: null, reason: 'category' };

  if (no(get('petAllowed'))) return { place: null, reason: 'notAllowed' };

  const lat = Number(get('lat'));
  const lng = Number(get('lng'));
  // 대한민국 범위 밖 좌표는 버려요.
  if (!(lat > 33 && lat < 39 && lng > 124 && lng < 132)) return { place: null, reason: 'coords' };

  const name = clean(get('name'));
  if (!name) return { place: null, reason: 'name' };
  if (isAnimalCafe(name)) return { place: null, reason: 'animalCafe' };

  const restriction = clean(get('restriction'));
  return {
    place: {
      id: `kcisa-${index}`,
      name,
      category,
      address: clean(get('roadAddress')) ?? clean(get('jibunAddress')) ?? '',
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
      petArea: petArea({ indoor: get('indoor'), outdoor: get('outdoor'), restriction }),
      largeDogOk: largeDogAllowed(get('sizeAllowed'), restriction),
      amenities: [],
      ...(clean(get('sizeAllowed')) && { sizeNote: clean(get('sizeAllowed')) }),
      ...(restriction && { restriction }),
      ...(clean(get('phone')) && { phone: clean(get('phone')) }),
      ...(normalizeDate(get('updatedAt')) && { verifiedAt: normalizeDate(get('updatedAt')) }),
    },
  };
}

/** 좌표 → 격자 키. 예: (37.56, 126.97) → "375_1269" */
export function cellKey(lat, lng) {
  return `${Math.floor(lat / CELL_SIZE)}_${Math.floor(lng / CELL_SIZE)}`;
}
