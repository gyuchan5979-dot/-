// 주소에서 "시도 / 시군구 / 읍면동"을 뽑아 동네 검색 목록을 만들어요.
// 외부 API 없이 우리 데이터의 가게 위치 평균으로 동네 중심을 잡아요.

const SIDO = [
  [/전남광주/, '전남광주'],
  [/^서울/, '서울'],
  [/^부산/, '부산'],
  [/^대구/, '대구'],
  [/^인천/, '인천'],
  [/^광주/, '광주'],
  [/^대전/, '대전'],
  [/^울산/, '울산'],
  [/^세종/, '세종'],
  [/^경기/, '경기'],
  [/^강원/, '강원'],
  [/^충청북|^충북/, '충북'],
  [/^충청남|^충남/, '충남'],
  [/^전라북|^전북/, '전북'],
  [/^전라남|^전남/, '전남'],
  [/^경상북|^경북/, '경북'],
  [/^경상남|^경남/, '경남'],
  [/^제주/, '제주'],
];

export function shortSido(token) {
  for (const [re, name] of SIDO) if (re.test(token)) return name;
  return null;
}

/** "성수동2가" → "성수동", "삼덕동3가" → "삼덕동" */
export function normalizeDong(dong) {
  return String(dong).replace(/\d+가동$/, '동').replace(/\d+가$/, '').replace(/제?\d+동$/, '동');
}

/**
 * @param {string} address
 * @param {string} [dongHint] 원본 데이터에 따로 있는 읍면동 이름
 * @returns {{ sido: string, sigungu: string, dong?: string } | null}
 */
export function parseArea(address, dongHint) {
  const main = String(address).replace(/\(.*$/, '').trim();
  const tokens = main.split(/\s+/);
  const sido = shortSido(tokens[0] ?? '');
  if (!sido) return null;

  let i = 1;
  const parts = [];
  // "고양시 덕양구"처럼 시 + 구가 이어지는 경우까지
  while (i < tokens.length && parts.length < 2 && /[시군구]$/.test(tokens[i]) && !/[로길]$/.test(tokens[i])) {
    parts.push(tokens[i]);
    i++;
  }
  // 세종처럼 시군구가 없는 곳은 시도 이름을 그대로 써요.
  const sigungu = parts.join(' ') || sido;

  let dong;
  if (i < tokens.length && /[읍면동]$/.test(tokens[i])) dong = tokens[i];
  if (!dong && dongHint) dong = dongHint;
  if (!dong) {
    // 식약처 주소: "...(1층 성수동2가)" 괄호 안 마지막 단어
    const paren = String(address).match(/\(([^)]*)\)/);
    const last = paren?.[1].split(/[\s,]+/).pop();
    if (last && /(동|가|읍|면)$/.test(last) && !/층$/.test(last)) dong = last;
  }
  return { sido, sigungu, ...(dong && { dong: normalizeDong(dong) }) };
}

/**
 * 검색용 목록: 동네(시군구·읍면동)와 가게 이름
 * @param {{ id: string, name: string, address: string, lat: number, lng: number, dong?: string }[]} places
 */
export function buildSearchIndex(places) {
  const areas = new Map();
  const add = (label, p) => {
    const a = areas.get(label) ?? { label, lat: 0, lng: 0, count: 0 };
    a.lat += p.lat;
    a.lng += p.lng;
    a.count++;
    areas.set(label, a);
  };

  for (const p of places) {
    const area = parseArea(p.address, p.dong);
    if (!area) continue;
    const base = area.sigungu === area.sido ? area.sido : `${area.sido} ${area.sigungu}`;
    add(base, p);
    if (area.dong) add(`${base} ${area.dong}`, p);
  }

  const round = (n) => Math.round(n * 1e5) / 1e5;
  return {
    areas: [...areas.values()]
      .map((a) => ({ label: a.label, lat: round(a.lat / a.count), lng: round(a.lng / a.count), count: a.count }))
      .sort((a, b) => b.count - a.count),
    // 가게 이름 검색용 (짧게): [id, 이름, 시군구, 위도, 경도]
    places: places.map((p) => {
      const area = parseArea(p.address, p.dong);
      const where = area ? (area.sigungu === area.sido ? area.sido : `${area.sido} ${area.sigungu}`) : '';
      return [p.id, p.name, where, round(p.lat), round(p.lng)];
    }),
  };
}
