#!/usr/bin/env node
// 한국관광공사 반려동물 동반여행 API → data/sources/tourapi.json, 그다음 public/places/ 다시 만들기
//
// 사용법: TOUR_API_KEY=<디코딩된 서비스 키> npm run data:tourapi
//
// - 서비스 키: 공공데이터포털에서 「한국관광공사_반려동물_동반여행_서비스」 활용신청 (개발계정 자동승인)
//   https://www.data.go.kr/data/15135102/openapi.do
// - 개발계정은 하루 1,000회 호출 제한이 있어서, 가게별 상세 조회 결과를 data/cache/에 저장해 두고
//   다음 실행 때 이어서 받아요. (MAX_CALLS로 이번 실행의 호출 수를 제한)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildGrid } from './lib/grid.mjs';
import { assertOk, BASE_URL, CONTENT_TYPE_FOOD, extractItems, totalCount, tourToPlace } from './lib/tourapi.mjs';

const KEY = process.env.TOUR_API_KEY;
if (!KEY) {
  console.error('TOUR_API_KEY 환경변수에 공공데이터포털 서비스 키(Decoding)를 넣어 주세요.');
  process.exit(1);
}
const MAX_CALLS = Number(process.env.MAX_CALLS ?? 900);

const root = join(import.meta.dirname, '..');
const sourcesDir = join(root, 'data', 'sources');
const cacheDir = join(root, 'data', 'cache');
const cacheFile = join(cacheDir, 'tourapi-detail.json');

let calls = 0;

async function call(operation, params) {
  if (calls >= MAX_CALLS) throw new Error('MAX_CALLS');
  calls++;
  const qs = new URLSearchParams({ serviceKey: KEY, MobileOS: 'ETC', MobileApp: 'petFriendlyFinder', _type: 'json', ...params });
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/${operation}?${qs}`);
      const body = await res.text();
      let json;
      try {
        json = JSON.parse(body);
      } catch {
        throw new Error(`JSON이 아닌 응답 (${res.status}): ${body.slice(0, 200)}`);
      }
      assertOk(json);
      return json;
    } catch (e) {
      // 키·파라미터 오류는 다시 해도 같아요.
      if (attempt >= 4 || /TourAPI 오류/.test(e.message)) throw e;
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
    }
  }
}

/** 음식점 목록 전체 */
async function fetchFoodList() {
  const items = [];
  for (let pageNo = 1; ; pageNo++) {
    const json = await call('areaBasedList2', { contentTypeId: CONTENT_TYPE_FOOD, numOfRows: '1000', pageNo: String(pageNo), arrange: 'C' });
    const page = extractItems(json);
    items.push(...page);
    if (page.length === 0 || items.length >= totalCount(json)) break;
  }
  return items;
}

/** 가게별 반려동물 상세. 이미 받은 건 캐시에서 써요. */
async function fetchDetails(items, cache) {
  let stoppedEarly = false;
  for (const item of items) {
    if (item.contentid in cache) continue;
    try {
      const json = await call('detailPetTour2', { contentId: String(item.contentid) });
      cache[item.contentid] = extractItems(json)[0] ?? null;
    } catch (e) {
      if (e.message === 'MAX_CALLS') {
        stoppedEarly = true;
        break;
      }
      throw e;
    }
  }
  return stoppedEarly;
}

mkdirSync(cacheDir, { recursive: true });
const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};

let items;
let stoppedEarly = false;
try {
  items = await fetchFoodList();
  console.log(`음식점 목록 ${items.length}곳`);
  stoppedEarly = await fetchDetails(items, cache);
} finally {
  writeFileSync(cacheFile, JSON.stringify(cache));
}

const places = [];
const skipped = {};
for (const item of items) {
  const { place, reason } = tourToPlace(item, cache[item.contentid]);
  if (place) places.push(place);
  else skipped[reason] = (skipped[reason] ?? 0) + 1;
}

mkdirSync(sourcesDir, { recursive: true });
writeFileSync(
  join(sourcesDir, 'tourapi.json'),
  JSON.stringify({ label: '한국관광공사 「반려동물 동반여행 서비스」', fetchedAt: new Date().toISOString().slice(0, 10), places }),
);

const remaining = items.filter((i) => !(i.contentid in cache)).length;
console.log(`이번 실행 호출 ${calls}회 → 식당·카페 ${places.length}곳`);
console.log('제외:', skipped);
if (stoppedEarly) console.log(`⚠️ 호출 한도에 걸려 ${remaining}곳의 상세가 남았어요. 내일 다시 실행하면 이어서 받아요.`);

const result = buildGrid(sourcesDir, join(root, 'public', 'places'));
console.log(`\n앱 데이터: 합계 ${result.total}곳 (중복 제거 ${result.duplicates}곳)`);
