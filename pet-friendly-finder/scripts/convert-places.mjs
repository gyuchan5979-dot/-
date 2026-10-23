#!/usr/bin/env node
// 공공데이터 CSV → data/sources/kcisa.json, 그다음 public/places/ 다시 만들기
//
// 사용법: npm run data:convert -- <CSV 파일 경로> [출처 폴더] [출력 폴더]
//
// 원본: 공공데이터포털 「한국문화정보원_전국 반려동물 동반 가능 문화시설 위치 데이터」
// https://www.data.go.kr/data/15111389/fileData.do

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import { buildGrid } from './lib/grid.mjs';
import { resolveColumns, toPlace } from './lib/transform.mjs';

const input = process.argv[2];
if (!input) {
  console.error('사용법: npm run data:convert -- <CSV 파일 경로>');
  process.exit(1);
}
const root = join(import.meta.dirname, '..');
const sourcesDir = process.argv[3] ?? join(root, 'data', 'sources');
const outDir = process.argv[4] ?? join(root, 'public', 'places');

/** 공공데이터 CSV는 UTF-8(BOM 포함)과 CP949가 섞여 있어서 둘 다 처리해요. */
function decode(buf) {
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString('utf8');
  const utf8 = buf.toString('utf8');
  return utf8.includes('�') ? iconv.decode(buf, 'cp949') : utf8;
}

const rows = parse(decode(readFileSync(input)), { relax_column_count: true, skip_empty_lines: true });
const [header, ...body] = rows;
const columns = resolveColumns(header);

const places = [];
const skipped = {};
const categoryCounts = {};

body.forEach((row) => {
  const cat = [row[columns.cat1], row[columns.cat2], row[columns.cat3]].filter(Boolean).join(' > ');
  categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;

  const { place, reason } = toPlace(row, columns);
  if (place) places.push(place);
  else skipped[reason] = (skipped[reason] ?? 0) + 1;
});

mkdirSync(sourcesDir, { recursive: true });
writeFileSync(
  join(sourcesDir, 'kcisa.json'),
  JSON.stringify({
    label: '한국문화정보원 「전국 반려동물 동반 가능 문화시설 위치 데이터」',
    fetchedAt: new Date().toISOString().slice(0, 10),
    places,
  }),
);

console.log(`원본 ${body.length}행 → 식당·카페 ${places.length}곳`);
console.log('제외:', skipped);
console.log('\n카테고리별 원본 행 수 (식당·카페 분류가 맞는지 확인하세요):');
Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)
  .forEach(([cat, n]) => console.log(`  ${String(n).padStart(6)}  ${cat}`));

const result = buildGrid(sourcesDir, outDir);
console.log(`\n앱 데이터: 합계 ${result.total}곳 (격자 ${result.cells.length}개, 중복 제거 ${result.duplicates}곳)`);
