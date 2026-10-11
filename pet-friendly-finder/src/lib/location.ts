import { Accuracy, Device, GetCurrentLocationPermissionError } from '@apps-in-toss/web-framework';
import type { Coords } from '../types';

/** 위치를 못 받을 때 쓰는 기본 위치 (서울시청) */
export const DEFAULT_COORDS: Coords = { lat: 37.5663, lng: 126.9779 };

export type LocationSource = 'toss' | 'browser' | 'default';

export interface LocationResult {
  coords: Coords;
  source: LocationSource;
  /** 사용자가 위치 권한을 거부했는지 */
  denied: boolean;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function fromToss(): Promise<Coords> {
  const location = await withTimeout(Device.getLocation({ accuracy: Accuracy.Balanced }), 8000);
  return { lat: location.coords.latitude, lng: location.coords.longitude };
}

function fromBrowser(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('geolocation unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

/**
 * 토스 앱 안에서는 앱인토스 SDK로, 일반 브라우저(로컬 개발)에서는
 * 브라우저 Geolocation으로 위치를 받아요. 둘 다 실패하면 기본 위치를 써요.
 */
export async function getMyLocation(): Promise<LocationResult> {
  try {
    return { coords: await fromToss(), source: 'toss', denied: false };
  } catch (e) {
    if (e instanceof GetCurrentLocationPermissionError) {
      return { coords: DEFAULT_COORDS, source: 'default', denied: true };
    }
    // 토스 앱 밖이라 브리지가 없는 경우 → 브라우저 위치로 시도
  }

  try {
    return { coords: await fromBrowser(), source: 'browser', denied: false };
  } catch (e) {
    const denied = e instanceof GeolocationPositionError && e.code === e.PERMISSION_DENIED;
    return { coords: DEFAULT_COORDS, source: 'default', denied };
  }
}

/** 외부 링크(카카오맵 길찾기 등) 열기 */
export async function openExternal(url: string): Promise<void> {
  try {
    await withTimeout(Device.openURL(url), 3000);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}
