#!/usr/bin/env node
// data/sources/*.json → public/places/ (중복 제거 후 격자 파일)
//
// 사용법: npm run data:build [-- <출처 폴더> <출력 폴더>]

import { join } from 'node:path';
import { buildGrid } from './lib/grid.mjs';

const root = join(import.meta.dirname, '..');
const sourcesDir = process.argv[2] ?? join(root, 'data', 'sources');
const outDir = process.argv[3] ?? join(root, 'public', 'places');

const result = buildGrid(sourcesDir, outDir);
console.log(`합계 ${result.total}곳 (격자 ${result.cells.length}개, 중복 제거 ${result.duplicates}곳)`);
for (const s of result.sources) console.log(`  ${s.name}: ${s.count}곳`);
