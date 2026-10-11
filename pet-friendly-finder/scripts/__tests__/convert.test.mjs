import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import iconv from 'iconv-lite';
import { describe, expect, it } from 'vitest';
import { classify, isAnimalCafe, largeDogAllowed, normalizeDate, petArea, resolveColumns, toPlace } from '../lib/transform.mjs';

// 테스트용 가상 행이에요. 컬럼명은 공공데이터 파일 명세 형식을 따랐어요.
const HEADER = [
  '시설명', '카테고리1', '카테고리2', '카테고리3', '위도', '경도', '도로명주소', '지번주소', '전화번호',
  '반려동물 동반 가능정보', '입장 가능 동물 크기', '반려동물 제한사항', '장소(실내) 여부', '장소(실외)여부', '최종작성일',
];
const row = (overrides = {}) => {
  const base = {
    시설명: '테스트카페', 카테고리1: '반려동반여행', 카테고리2: '카페', 카테고리3: '카페', 위도: '37.5665', 경도: '126.978',
    도로명주소: '서울 중구 세종대로 110', 지번주소: '', 전화번호: '02-000-0000', '반려동물 동반 가능정보': 'Y',
    '입장 가능 동물 크기': '모두 가능', '반려동물 제한사항': '목줄 착용', '장소(실내) 여부': 'Y', '장소(실외)여부': 'N',
    최종작성일: '2025-03-24',
  };
  const merged = { ...base, ...overrides };
  return HEADER.map((h) => merged[h]);
};

describe('transform', () => {
  const columns = resolveColumns(HEADER);

  it('컬럼명의 공백·괄호 차이를 무시하고 찾는다', () => {
    const cols = resolveColumns(['시설 명', '위도', '경도', '장소 실내 여부']);
    expect(cols).toMatchObject({ name: 0, lat: 1, lng: 2, indoor: 3 });
  });

  it('필수 컬럼이 없으면 에러', () => {
    expect(() => resolveColumns(['시설명', '주소'])).toThrow(/위도/);
  });

  it('카페 행을 Place로 바꾼다', () => {
    const { place } = toPlace(row(), columns, 7);
    expect(place).toEqual({
      id: 'kcisa-7', name: '테스트카페', category: 'cafe', address: '서울 중구 세종대로 110',
      lat: 37.5665, lng: 126.978, petArea: 'indoor', largeDogOk: true, amenities: [],
      sizeNote: '모두 가능', restriction: '목줄 착용', phone: '02-000-0000', verifiedAt: '2025-03-24',
    });
  });

  it('카테고리2가 "반려동물식당카페"여도 카테고리3으로 식당을 구분한다', () => {
    const { place } = toPlace(row({ 카테고리2: '반려동물식당카페', 카테고리3: '식당' }), columns, 0);
    expect(place.category).toBe('restaurant');
  });

  it('고양이·라쿤 카페는 빼고, 강아지와 함께인 곳은 남긴다', () => {
    for (const n of ['고양이다락방 신촌점', '2Cats', '야옹야옹캣카페', '라쿤카페 꾸꾸네', '똥꼬냥']) expect(isAnimalCafe(n)).toBe(true);
    for (const n of ['냥냥댕댕 카페 수제간식', '애니멀 패밀리 반려견카페', '사직커피', '카페 구할구 남산']) expect(isAnimalCafe(n)).toBe(false);
    expect(toPlace(row({ 시설명: '고양이정원' }), columns, 0).reason).toBe('animalCafe');
  });

  it('"제한사항 없음"은 비운다', () => {
    const { place } = toPlace(row({ '반려동물 제한사항': '제한사항 없음' }), columns, 0);
    expect(place.restriction).toBeUndefined();
  });

  it('식당·카페가 아니거나 동반 불가·좌표 이상이면 제외', () => {
    expect(toPlace(row({ 카테고리2: '동물병원', 카테고리3: '동물병원' }), columns, 0).reason).toBe('category');
    expect(toPlace(row({ '반려동물 동반 가능정보': 'N' }), columns, 0).reason).toBe('notAllowed');
    expect(toPlace(row({ 위도: '0' }), columns, 0).reason).toBe('coords');
  });

  it('분류·크기·범위 규칙', () => {
    expect(classify('반려동반여행 식당')).toBe('restaurant');
    expect(classify('반려동반여행 카페')).toBe('cafe');
    expect(largeDogAllowed('15kg 미만')).toBe(false);
    expect(largeDogAllowed('30kg 이하')).toBe(true);
    expect(largeDogAllowed('소형견')).toBe(false);
    expect(petArea({ indoor: 'N', outdoor: 'Y' })).toBe('terrace');
    expect(petArea({ indoor: 'Y', restriction: '이동장 필수' })).toBe('carrier');
    expect(petArea({})).toBe('unknown');
    expect(normalizeDate('20250324')).toBe('2025-03-24');
    expect(largeDogAllowed('모두 가능', '대형견 입장 불가')).toBe(false);
    expect(largeDogAllowed('소형/중형')).toBe(false);
    expect(petArea({ indoor: 'Y', outdoor: 'Y', restriction: '실외만 동반 가능' })).toBe('terrace');
    expect(petArea({ indoor: 'Y', restriction: '야외테라스만 동반 가능' })).toBe('terrace');
    expect(petArea({ indoor: 'Y', restriction: '안고 있어야 함' })).toBe('carrier');
  });
});

describe('convert-places CLI', () => {
  it('CP949 CSV를 격자별 JSON으로 변환한다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'places-'));
    const csv = [
      HEADER,
      row(),
      row({ 시설명: '테스트식당', 카테고리2: '식당', 카테고리3: '식당', 위도: '37.72', 경도: '127.19' }),
      row({ 시설명: '테스트병원', 카테고리2: '동물병원', 카테고리3: '동물병원' }),
    ]
      .map((r) => r.map((v) => `"${v}"`).join(','))
      .join('\n');
    const input = join(dir, 'in.csv');
    writeFileSync(input, iconv.encode(csv, 'cp949'));
    const out = join(dir, 'out');

    execFileSync('node', [join(import.meta.dirname, '..', 'convert-places.mjs'), input, out]);

    const index = JSON.parse(readFileSync(join(out, 'index.json'), 'utf8'));
    expect(index.total).toBe(2);
    expect(index.cells).toEqual(['375_1269', '377_1271']);
    const seoul = JSON.parse(readFileSync(join(out, '375_1269.json'), 'utf8'));
    expect(seoul.map((p) => p.name)).toEqual(['테스트카페']);
  });
});
