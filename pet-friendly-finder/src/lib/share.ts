import { Share } from '@apps-in-toss/web-framework';
import type { Coords, Place } from '../types';
import { isTossWebView } from './storage';

// 가게 공유: 토스 공유 링크(intoss://)를 만들어 공유 시트로 보내요.
// 링크를 받은 사람이 열면 그 가게 근처로 이동해서 상세가 바로 열려요.

export const APP_NAME = 'pet-friendly-finder';

export interface SharedPlace {
  id: string;
  coords: Coords;
}

/** intoss://pet-friendly-finder?place=ID&lat=..&lng=.. */
export function sharePath(place: Pick<Place, 'id' | 'lat' | 'lng'>): string {
  const qs = new URLSearchParams({ place: place.id, lat: String(place.lat), lng: String(place.lng) });
  return `intoss://${APP_NAME}?${qs}`;
}

/** 공유 링크로 들어왔는지 (주소의 쿼리에서 읽어요) */
export function parseSharedPlace(search: string): SharedPlace | null {
  const qs = new URLSearchParams(search);
  const id = qs.get('place');
  const lat = Number(qs.get('lat'));
  const lng = Number(qs.get('lng'));
  if (!id || !(lat > 33 && lat < 39 && lng > 124 && lng < 132)) return null;
  return { id, coords: { lat, lng } };
}

export function shareMessage(place: Pick<Place, 'name' | 'address'>, link: string): string {
  return `🐶 우리 강아지랑 같이 갈 수 있는 곳이에요!\n${place.name}\n${place.address}\n\n${link}`;
}

/** @returns 'shared' | 'copied' | 'failed' */
export async function sharePlace(place: Place): Promise<'shared' | 'copied' | 'failed'> {
  if (isTossWebView()) {
    try {
      const link = await Share.createLink({ path: sharePath(place) });
      await Share.sendMessage({ message: shareMessage(place, link) });
      return 'shared';
    } catch {
      return 'failed';
    }
  }
  // 브라우저(개발용): 같은 쿼리를 붙인 현재 주소를 써요.
  const qs = sharePath(place).split('?')[1];
  const link = `${window.location.origin}${window.location.pathname}?${qs}`;
  try {
    if (navigator.share) {
      await navigator.share({ text: shareMessage(place, link) });
      return 'shared';
    }
    await navigator.clipboard.writeText(shareMessage(place, link));
    return 'copied';
  } catch {
    return 'failed';
  }
}
