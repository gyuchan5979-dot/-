#!/usr/bin/env node
// 공공데이터 CSV → public/places/ 격자별 JSON 변환
//
// 사용법: npm run data:convert -- <CSV 파일 경로> [출력 폴더, 기본값 public/places]
//
// 원본: 공공데이터포털 「한국문화정보원_전국 반려동물 동반 가능 문화시설 위치 데이터」
// https://www.data.go.kr/data/15111389/fileData.do

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import { CELL_SIZE, cellKey, resolveColumns, toPlace } from './lib/transform.mjs';

const input = process.argv[2];
if (!input) {
  console.error('사용법: npm run data:convert -- <CSV 파일 경로>');
  process.exit(1);
}

/** 공공데이터 CSV는 UTF-8(BOM 포함)과 CP949가 섞여 있어서 둘 다 처리해요. */
function decode(buf) {
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString('utf8');
  const utf8 = buf.toString('utf8');
  return utf8.includes('�') ? iconv.decode(buf, 'cp949') : utf8;
}

const rows = parse(decode(readFileSync(input)), { relax_column_count: true, skip_empty_lines: true });
const [header, ...body] = rows;
const columns = resolveColumns(header);

const cells = new Map();
const skipped = {};
const categoryCounts = {};

body.forEach((row, i) => {
  const cat = [row[columns.cat1], row[columns.cat2], row[columns.cat3]].filter(Boolean).join(' > ');
  categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;

  const { place, reason } = toPlace(row, columns, i);
  if (!place) {
    skipped[reason] = (skipped[reason] ?? 0) + 1;
    return;
  }
  const key = cellKey(place.lat, place.lng);
  if (!cells.has(key)) cells.set(key, []);
  cells.get(key).push(place);
});

const outDir = process.argv[3] ?? join(import.meta.dirname, '..', 'public', 'places');
mkdirSync(outDir, { recursive: true });
// 이전 변환 결과(JSON)만 지워요.
for (const f of readdirSync(outDir)) if (f.endsWith('.json')) rmSync(join(outDir, f));

let total = 0;
for (const [key, places] of cells) {
  writeFileSync(join(outDir, `${key}.json`), JSON.stringify(places));
  total += places.length;
}
writeFileSync(
  join(outDir, 'index.json'),
  JSON.stringify({
    cellSize: CELL_SIZE,
    cells: [...cells.keys()].sort(),
    total,
    source: '한국문화정보원_전국 반려동물 동반 가능 문화시설 위치 데이터',
    generatedAt: new Date().toISOString().slice(0, 10),
  }),
);

console.log(`원본 ${body.length}행 → 식당·카페 ${total}곳 (격자 ${cells.size}개)`);
console.log('제외:', skipped);
console.log('\n카테고리별 원본 행 수 (식당·카페 분류가 맞는지 확인하세요):');
Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)
  .forEach(([cat, n]) => console.log(`  ${String(n).padStart(6)}  ${cat}`));
