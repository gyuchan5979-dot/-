import { useCallback, useEffect, useState } from 'react';
import { Storage } from '@apps-in-toss/web-framework';
import type { Place } from '../types';

// 찜한 장소. 기기에만 저장하고 서버로 보내지 않아요.
// 토스 앱에서는 앱인토스 Storage(앱을 지워도 토스에 남아요), 브라우저에서는 localStorage를 써요.
// 다른 지역에서도 목록을 보여줄 수 있게 장소 정보를 통째로 저장해요.

const KEY = 'favorites.v1';
/** 너무 커지지 않게 최대 개수 */
export const MAX_FAVORITES = 200;

function isTossWebView(): boolean {
  return typeof window !== 'undefined' && (window as { ReactNativeWebView?: unknown }).ReactNativeWebView != null;
}

async function read(): Promise<string | null> {
  if (isTossWebView()) {
    try {
      return await Storage.getItem(KEY);
    } catch {
      return null;
    }
  }
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

async function write(value: string): Promise<void> {
  if (isTossWebView()) {
    try {
      await Storage.setItem(KEY, value);
    } catch {
      // 저장 실패해도 이번 실행 동안은 화면에 반영돼 있어요.
    }
    return;
  }
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // 사생활 보호 모드 등
  }
}

export function parseFavorites(raw: string | null): Place[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((p) => p && typeof p.id === 'string' && typeof p.lat === 'number') : [];
  } catch {
    return [];
  }
}

/** 찜 추가/해제 결과 목록 (최근에 찜한 것이 앞) */
export function toggleFavorite(list: Place[], place: Place): Place[] {
  if (list.some((p) => p.id === place.id)) return list.filter((p) => p.id !== place.id);
  // 거리 같은 화면용 값은 빼고 저장해요.
  const { distanceM: _distance, ...rest } = place as Place & { distanceM?: number };
  return [rest, ...list].slice(0, MAX_FAVORITES);
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Place[]>([]);

  useEffect(() => {
    read().then((raw) => setFavorites(parseFavorites(raw)));
  }, []);

  /** 찜을 추가했으면 true, 해제했으면 false */
  const toggle = useCallback(
    (place: Place): boolean => {
      const next = toggleFavorite(favorites, place);
      setFavorites(next);
      void write(JSON.stringify(next));
      return !favorites.some((p) => p.id === place.id);
    },
    [favorites],
  );

  const isFavorite = useCallback((id: string) => favorites.some((p) => p.id === id), [favorites]);

  return { favorites, toggle, isFavorite };
}
