import type { Place } from '../types';

// 길찾기 링크. 앱이 깔려 있으면 앱으로, 없으면 웹 지도로 열려요.

/** 카카오맵 길찾기 (도착지 = 가게) */
export function kakaoDirectionsUrl(place: Pick<Place, 'name' | 'lat' | 'lng'>): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;
}

/** 네이버 지도 길찾기 (도착지 = 가게, 자동차 경로) */
export function naverDirectionsUrl(place: Pick<Place, 'name' | 'lat' | 'lng'>): string {
  const qs = new URLSearchParams({
    elng: String(place.lng),
    elat: String(place.lat),
    etext: place.name,
    menu: 'route',
    pathType: '0',
  });
  return `https://map.naver.com/index.nhn?${qs}`;
}
