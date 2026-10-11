import { User } from '@apps-in-toss/web-framework';
import type { Category, Coords, PetArea, Place } from '../types';

// Supabase REST(PostgREST)를 fetch로 직접 불러요. 테이블·권한은 supabase/schema.sql 참고.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const reportingEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export type ReportKind = 'closed' | 'not_allowed' | 'wrong_info' | 'other';

export const REPORT_KIND_LABEL: Record<ReportKind, string> = {
  closed: '폐업했어요',
  not_allowed: '이제 반려견 동반이 안 돼요',
  wrong_info: '동반 조건(크기·실내 등)이 달라요',
  other: '기타',
};

export interface NewPlaceInput {
  name: string;
  category: Category;
  address: string;
  coords: Coords;
  petArea: PetArea;
  largeDogOk: boolean;
  note: string;
}

export type SubmitResult = 'ok' | 'duplicate' | 'error';

const STORAGE_KEY = 'pff.reporterKey';
let reporterKeyPromise: Promise<string> | null = null;

/**
 * 같은 사람이 같은 제보를 반복하지 못하게 쓰는 익명 키.
 * 토스 앱에서는 앱인토스 익명 키를, 브라우저에서는 기기에 저장한 임의 값을 써요.
 */
function getReporterKey(): Promise<string> {
  reporterKeyPromise ??= (async () => {
    try {
      const res = await User.getAnonymousKey();
      if (res?.type === 'HASH' && res.hash) return `toss-${res.hash}`.slice(0, 128);
    } catch {
      // 토스 앱 밖이거나 버전이 낮으면 아래로
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
      const key = `web-${crypto.randomUUID()}`;
      localStorage.setItem(STORAGE_KEY, key);
      return key;
    } catch {
      return `web-${crypto.randomUUID()}`;
    }
  })();
  return reporterKeyPromise;
}

function headers(): HeadersInit {
  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    // 앱에는 읽기 권한이 없어서 저장 결과를 돌려받지 않아요.
    Prefer: 'return=minimal',
  };
}

async function insert(table: string, row: Record<string, unknown>): Promise<SubmitResult> {
  if (!reportingEnabled) return 'error';
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(row),
    });
    if (res.ok) return 'ok';
    // 23505: 같은 날 같은 제보 (unique 위반)
    if (res.status === 409) return 'duplicate';
    return 'error';
  } catch {
    return 'error';
  }
}

export async function reportPlace(place: Place, kind: ReportKind, note: string): Promise<SubmitResult> {
  return insert('place_reports', {
    place_id: place.id,
    place_name: place.name.slice(0, 100),
    kind,
    note: note.trim().slice(0, 300) || null,
    reporter_key: await getReporterKey(),
  });
}

export async function submitPlace(input: NewPlaceInput): Promise<SubmitResult> {
  return insert('place_submissions', {
    name: input.name.trim().slice(0, 60),
    category: input.category,
    address: input.address.trim().slice(0, 120) || null,
    lat: Math.round(input.coords.lat * 1e6) / 1e6,
    lng: Math.round(input.coords.lng * 1e6) / 1e6,
    pet_area: input.petArea,
    large_dog_ok: input.largeDogOk,
    note: input.note.trim().slice(0, 300) || null,
    reporter_key: await getReporterKey(),
  });
}

interface SubmissionRow {
  id: number;
  name: string;
  category: Category;
  address: string | null;
  lat: number;
  lng: number;
  pet_area: PetArea;
  large_dog_ok: boolean;
  verified_at: string | null;
}

/** 운영자가 승인한 사용자 제보 중 반경 안에 들어올 수 있는 것 */
export async function loadApprovedSubmissions(center: Coords, radiusM: number): Promise<Place[]> {
  if (!reportingEnabled) return [];
  const dLat = radiusM / 111_000;
  const dLng = radiusM / (111_000 * Math.cos((center.lat * Math.PI) / 180));
  const qs = new URLSearchParams([
    ['select', 'id,name,category,address,lat,lng,pet_area,large_dog_ok,verified_at'],
    ['status', 'eq.approved'],
    ['lat', `gte.${center.lat - dLat}`],
    ['lat', `lte.${center.lat + dLat}`],
    ['lng', `gte.${center.lng - dLng}`],
    ['lng', `lte.${center.lng + dLng}`],
    ['limit', '500'],
  ]);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/place_submissions?${qs}`, { headers: headers() });
    if (!res.ok) return [];
    const rows = (await res.json()) as SubmissionRow[];
    return rows.map((r) => ({
      id: `user-${r.id}`,
      name: r.name,
      category: r.category,
      address: r.address ?? '',
      lat: r.lat,
      lng: r.lng,
      petArea: r.pet_area,
      largeDogOk: r.large_dog_ok,
      amenities: [],
      ...(r.verified_at && { verifiedAt: r.verified_at }),
      source: 'user',
    }));
  } catch {
    return [];
  }
}
