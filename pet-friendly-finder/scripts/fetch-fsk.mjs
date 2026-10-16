#!/usr/bin/env node
// 식품안전나라 「반려동물 동반 가능 업소 현황」 → data/sources/fsk.json, 그다음 public/places/ 다시 만들기
//
// 사용법:
//   npm run data:fsk                          # 키 없이 (Nominatim, 정확한 주소만, 초당 1건)
//   KAKAO_REST_KEY=<키> npm run data:fsk      # 카카오 주소 검색 (더 많이·정확히)
//   npm run data:fsk -- <저장해 둔 HTML 파일>  # 페이지를 직접 받아 둔 경우
//
// 좌표 결과는 data/geocode-cache.json에 저장해서, 다시 실행하면 새 업소만 변환해요.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FSK_URL, fskToPlace, geocodeQuery, parseFskHtml } from './lib/fsk.mjs';
import { geocodeKakao, geocodeNominatim } from './lib/geocode.mjs';
import { buildGrid } from './lib/grid.mjs';

const root = join(import.meta.dirname, '..');
const sourcesDir = join(root, 'data', 'sources');
const cacheFile = join(root, 'data', 'geocode-cache.json');
const KAKAO_KEY = process.env.KAKAO_REST_KEY;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, init, tries = 5) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status >= 500 && i < tries) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (i >= tries) throw e;
      await sleep(2 ** i * 1000);
    }
  }
}

const html = process.argv[2]
  ? readFileSync(process.argv[2], 'utf8')
  : await (await fetchWithRetry(FSK_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();

const rows = parseFskHtml(html);
if (rows.length === 0) throw new Error('업소 목록을 찾지 못했어요. 페이지 구조가 바뀌었는지 확인해 주세요.');
console.log(`식약처 등록 업소 ${rows.length}곳`);

/** query → { lat, lng, by } | { miss: ['nominatim', 'kakao'] } */
const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};
const saveCache = () => writeFileSync(cacheFile, JSON.stringify(cache, null, 0));

const provider = KAKAO_KEY ? 'kakao' : 'nominatim';
const geocode = KAKAO_KEY
  ? (q) => geocodeKakao(q, KAKAO_KEY, fetchWithRetry)
  : (q) => geocodeNominatim(q, fetchWithRetry);
const delayMs = KAKAO_KEY ? 50 : 1100; // Nominatim 이용 정책: 초당 1건 이하

const queries = [...new Set(rows.map((r) => geocodeQuery(r.address)))];
const todo = queries.filter((q) => !cache[q]?.lat && !cache[q]?.miss?.includes(provider));
console.log(`좌표 변환: 전체 주소 ${queries.length}개 중 ${todo.length}개를 ${provider}로 변환할게요.`);

let done = 0;
for (const q of todo) {
  try {
    const geo = await geocode(q);
    cache[q] = geo ?? { miss: [...new Set([...(cache[q]?.miss ?? []), provider])] };
  } catch (e) {
    console.warn(`  실패: ${q} (${e.message})`);
  }
  if (++done % 50 === 0) {
    saveCache();
    console.log(`  ${done}/${todo.length}`);
  }
  await sleep(delayMs);
}
saveCache();

const fetchedAt = new Date().toISOString().slice(0, 10);
const places = [];
const skipped = {};
for (const row of rows) {
  const geo = cache[geocodeQuery(row.address)];
  const { place, reason } = fskToPlace(row, geo?.lat ? geo : null, fetchedAt);
  if (place) places.push(place);
  else skipped[reason] = (skipped[reason] ?? 0) + 1;
}

mkdirSync(sourcesDir, { recursive: true });
writeFileSync(
  join(sourcesDir, 'fsk.json'),
  JSON.stringify({ label: '식약처 「반려동물 동반 가능 업소 현황」', fetchedAt, places }),
);
console.log(`좌표가 있는 업소 ${places.length}곳 / 제외:`, skipped);

const result = buildGrid(sourcesDir, join(root, 'public', 'places'));
console.log(`\n앱 데이터: 합계 ${result.total}곳 (중복 제거 ${result.duplicates}곳)`);
for (const s of result.sources) console.log(`  ${s.name}: ${s.count}곳`);
