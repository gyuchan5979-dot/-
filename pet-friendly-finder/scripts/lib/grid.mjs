// 여러 출처(data/sources/*.json)의 가게를 합쳐서 public/places/ 격자 파일로 쓰는 부분이에요.

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CELL_SIZE, cellKey } from './transform.mjs';

/** 같은 가게로 보는 거리(m) */
const SAME_PLACE_M = 80;

const normName = (s) => String(s).replace(/[\s()（）\-_.·,]/g, '').toLowerCase();

function distanceM(a, b) {
  const dLat = (b.lat - a.lat) * 111_000;
  const dLng = (b.lng - a.lng) * 111_000 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/**
 * 출처 우선순위대로 합치면서 중복을 빼요.
 * 이름이 같거나 한쪽이 다른 쪽을 포함하고(예: "카페A" / "카페A 본점"), 80m 안이면 같은 가게로 봐요.
 * @param {{ name: string, places: object[] }[]} sources 앞쪽이 우선
 */
export function mergeSources(sources) {
  const merged = [];
  const byCell = new Map();
  let duplicates = 0;

  for (const { name: source, places } of sources) {
    for (const place of places) {
      const key = cellKey(place.lat, place.lng);
      const [la, ln] = key.split('_').map(Number);
      const n = normName(place.name);
      let dup = false;
      for (let i = -1; i <= 1 && !dup; i++) {
        for (let j = -1; j <= 1 && !dup; j++) {
          for (const other of byCell.get(`${la + i}_${ln + j}`) ?? []) {
            const m = normName(other.name);
            const similar = n === m || (Math.min(n.length, m.length) >= 3 && (n.includes(m) || m.includes(n)));
            if (similar && distanceM(place, other) <= SAME_PLACE_M) {
              dup = true;
              break;
            }
          }
        }
      }
      if (dup) {
        duplicates++;
        continue;
      }
      const withSource = { ...place, source };
      merged.push(withSource);
      if (!byCell.has(key)) byCell.set(key, []);
      byCell.get(key).push(withSource);
    }
  }
  return { places: merged, duplicates };
}

/** data/sources/*.json 읽기. 파일 이름 순서가 아니라 PRIORITY 순서로 합쳐요. */
const PRIORITY = ['fsk', 'tourapi', 'kcisa'];

export function readSources(sourcesDir) {
  let files = [];
  try {
    files = readdirSync(sourcesDir).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const rank = (f) => {
    const i = PRIORITY.indexOf(f.replace(/\.json$/, ''));
    return i < 0 ? PRIORITY.length : i;
  };
  return files
    .sort((a, b) => rank(a) - rank(b))
    .map((f) => ({ name: f.replace(/\.json$/, ''), ...JSON.parse(readFileSync(join(sourcesDir, f), 'utf8')) }));
}

/** 합친 결과를 격자 파일로 쓰고 요약을 돌려줘요. */
export function buildGrid(sourcesDir, outDir) {
  const sources = readSources(sourcesDir);
  const { places, duplicates } = mergeSources(sources);

  const cells = new Map();
  for (const p of places) {
    const key = cellKey(p.lat, p.lng);
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(p);
  }

  mkdirSync(outDir, { recursive: true });
  // 이전 결과(JSON)만 지워요.
  for (const f of readdirSync(outDir)) if (f.endsWith('.json')) rmSync(join(outDir, f));
  for (const [key, list] of cells) writeFileSync(join(outDir, `${key}.json`), JSON.stringify(list));

  const index = {
    cellSize: CELL_SIZE,
    cells: [...cells.keys()].sort(),
    total: places.length,
    sources: sources.map((s) => ({ name: s.name, label: s.label, count: s.places.length, fetchedAt: s.fetchedAt })),
    generatedAt: new Date().toISOString().slice(0, 10),
  };
  writeFileSync(join(outDir, 'index.json'), JSON.stringify(index));
  return { ...index, duplicates };
}
