import { Accuracy, Device, GetCurrentLocationPermissionError } from '@apps-in-toss/web-framework';
import type { Coords } from '../types';

/** 위치를 못 받을 때 쓰는 기본 위치 (서울시청) */
export const DEFAULT_COORDS: Coords = { lat: 37.5663, lng: 126.9779 };

export type LocationSource = 'toss' | 'browser' | 'default' | 'region';

export interface LocationResult {
  coords: Coords;
  source: LocationSource;
  /** 사용자가 위치 권한을 거부했는지 */
  denied: boolean;
  /** 지역을 직접 고른 경우 지역 이름 */
  label?: string;
}

/** 위치 권한 없이 둘러볼 수 있는 지역 (각 지역 중심 근처 좌표) */
export const REGIONS: { label: string; coords: Coords }[] = [
  { label: '서울 시청', coords: { lat: 37.5663, lng: 126.9779 } },
  { label: '서울 강남', coords: { lat: 37.4979, lng: 127.0276 } },
  { label: '서울 홍대', coords: { lat: 37.5572, lng: 126.9245 } },
  { label: '서울 성수', coords: { lat: 37.5446, lng: 127.0557 } },
  { label: '판교', coords: { lat: 37.3947, lng: 127.1112 } },
  { label: '수원', coords: { lat: 37.2636, lng: 127.0286 } },
  { label: '일산', coords: { lat: 37.6584, lng: 126.77 } },
  { label: '남양주 진접', coords: { lat: 37.7193, lng: 127.188 } },
  { label: '인천', coords: { lat: 37.4563, lng: 126.7052 } },
  { label: '춘천', coords: { lat: 37.8813, lng: 127.7298 } },
  { label: '강릉', coords: { lat: 37.7519, lng: 128.8761 } },
  { label: '대전', coords: { lat: 36.3504, lng: 127.3845 } },
  { label: '세종', coords: { lat: 36.48, lng: 127.289 } },
  { label: '전주', coords: { lat: 35.8242, lng: 127.148 } },
  { label: '광주', coords: { lat: 35.1601, lng: 126.8514 } },
  { label: '대구', coords: { lat: 35.8714, lng: 128.6014 } },
  { label: '부산 서면', coords: { lat: 35.1578, lng: 129.06 } },
  { label: '부산 해운대', coords: { lat: 35.163, lng: 129.1635 } },
  { label: '울산', coords: { lat: 35.5396, lng: 129.3115 } },
  { label: '제주', coords: { lat: 33.4996, lng: 126.5312 } },
  { label: '서귀포', coords: { lat: 33.2541, lng: 126.56 } },
];

export function regionLocation(region: (typeof REGIONS)[number]): LocationResult {
  return { coords: region.coords, source: 'region', denied: false, label: region.label };
}

/**
 * 이미 위치 권한을 허용한 사용자인지.
 * 허용 전이면 앱을 열자마자 권한 창을 띄우지 않고, 설명 화면에서 버튼을 눌렀을 때 요청해요.
 */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    return (await withTimeout(Device.getLocation.getPermission(), 2000)) === 'allowed';
  } catch {
    return false;
  }
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
