import { SAMPLE_PLACES } from '../data/samplePlaces';
import { loadApprovedSubmissions } from './reports';
import type { Coords, Place } from '../types';

interface PlacesIndex {
  cellSize: number;
  cells: string[];
  total: number;
  sources: { name: string; label: string; count: number; fetchedAt: string }[];
  generatedAt: string;
}

export interface PlacesResult {
  places: Place[];
  /** 실제 공공데이터인지, 샘플인지 */
  source: 'public-data' | 'sample';
  /** 화면에 표시할 출처 이름들 */
  sourceLabels: string[];
  generatedAt?: string;
}

const BASE = `${import.meta.env.BASE_URL}places`;

let indexPromise: Promise<PlacesIndex | null> | null = null;
const cellCache = new Map<string, Promise<Place[]>>();

function loadIndex(): Promise<PlacesIndex | null> {
  indexPromise ??= fetch(`${BASE}/index.json`)
    .then((res) => (res.ok ? (res.json() as Promise<PlacesIndex>) : null))
    // 개발 서버는 없는 파일에 index.html을 돌려줘서 JSON 파싱이 실패할 수 있어요.
    .catch(() => null);
  return indexPromise;
}

function loadCell(key: string): Promise<Place[]> {
  let cached = cellCache.get(key);
  if (!cached) {
    cached = fetch(`${BASE}/${key}.json`).then((res) => (res.ok ? (res.json() as Promise<Place[]>) : []));
    cached.catch(() => cellCache.delete(key));
    cellCache.set(key, cached);
  }
  return cached;
}

/** 반경을 덮는 격자 키 목록 */
export function cellsAround(center: Coords, radiusM: number, cellSize: number): string[] {
  const dLat = radiusM / 111_000;
  const dLng = radiusM / (111_000 * Math.cos((center.lat * Math.PI) / 180));
  const keys: string[] = [];
  for (let la = Math.floor((center.lat - dLat) / cellSize); la <= Math.floor((center.lat + dLat) / cellSize); la++) {
    for (let ln = Math.floor((center.lng - dLng) / cellSize); ln <= Math.floor((center.lng + dLng) / cellSize); ln++) {
      keys.push(`${la}_${ln}`);
    }
  }
  return keys;
}

/**
 * 현재 위치 반경 안에 들어올 수 있는 가게를 불러와요.
 * 변환된 공공데이터(public/places/)가 있으면 그걸 쓰고, 없으면 샘플 데이터를 써요.
 * 운영자가 승인한 사용자 제보도 함께 붙여요.
 */
export async function loadPlacesNear(center: Coords, radiusM: number): Promise<PlacesResult> {
  const [index, submitted] = await Promise.all([loadIndex(), loadApprovedSubmissions(center, radiusM)]);
  const userLabels = submitted.length > 0 ? ['사용자 제보'] : [];
  if (!index) return { places: [...SAMPLE_PLACES, ...submitted], source: 'sample', sourceLabels: userLabels };

  const available = new Set(index.cells);
  const keys = cellsAround(center, radiusM, index.cellSize).filter((k) => available.has(k));
  const chunks = await Promise.all(keys.map(loadCell));
  return {
    places: [...chunks.flat(), ...submitted],
    source: 'public-data',
    sourceLabels: [...index.sources.map((s) => s.label), ...userLabels],
    generatedAt: index.generatedAt,
  };
}
