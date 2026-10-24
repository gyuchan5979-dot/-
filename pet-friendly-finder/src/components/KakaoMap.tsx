import { useEffect, useRef, useState } from 'react';
import type { Coords, PlaceWithDistance } from '../types';

// 카카오맵 JS SDK에서 쓰는 부분만 최소한으로 선언해요.
interface KakaoLatLng {
  getLat(): number;
}
interface KakaoMapInstance {
  setCenter(latlng: KakaoLatLng): void;
  setBounds(bounds: unknown): void;
}
interface KakaoMarker {
  setMap(map: KakaoMapInstance | null): void;
}
interface KakaoMaps {
  load(cb: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => { extend(latlng: KakaoLatLng): void };
  Map: new (el: HTMLElement, opts: { center: KakaoLatLng; level: number }) => KakaoMapInstance;
  Marker: new (opts: { position: KakaoLatLng; title?: string; map?: KakaoMapInstance }) => KakaoMarker;
  CustomOverlay: new (opts: {
    position: KakaoLatLng;
    content: HTMLElement;
    map?: KakaoMapInstance;
    yAnchor?: number;
    /** true면 지도가 이 요소의 탭을 가로채지 않아요 */
    clickable?: boolean;
    zIndex?: number;
  }) => KakaoMarker;
  event: { addListener(target: unknown, type: string, handler: () => void): void };
}
declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

const APP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined;

let sdkPromise: Promise<KakaoMaps> | null = null;

function loadKakaoSdk(appKey: string): Promise<KakaoMaps> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    // SDK가 이어서 받는 파일이 막히면 콜백이 영영 안 올 수 있어서, 10초 넘으면 실패로 봐요.
    const timer = setTimeout(() => reject(new Error('kakao maps load timeout')), 10_000);
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error('kakao maps not available'));
        return;
      }
      maps.load(() => {
        clearTimeout(timer);
        resolve(maps);
      });
    };
    script.onerror = () => reject(new Error('kakao maps script failed to load'));
    document.head.appendChild(script);
  });
  sdkPromise.catch(() => {
    sdkPromise = null;
  });
  return sdkPromise;
}

interface Props {
  center: Coords;
  places: PlaceWithDistance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function KakaoMap({ center, places, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ maps: KakaoMaps; map: KakaoMapInstance } | null>(null);
  // 지도는 처음 위치로 한 번만 만들고, 이후 이동은 아래 effect에서 처리해요.
  const initialCenter = useRef(center);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(APP_KEY ? 'loading' : 'error');

  useEffect(() => {
    if (!APP_KEY || !containerRef.current) return;
    let cancelled = false;
    loadKakaoSdk(APP_KEY)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(initialCenter.current.lat, initialCenter.current.lng),
          level: 5,
        });
        mapRef.current = { maps, map };
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, []);

  // 핀을 누를 때마다 지도가 다시 맞춰지지 않게, 최신 onSelect는 ref로 들고 있어요.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  const pinsRef = useRef(new Map<string, HTMLButtonElement>());

  // 장소 목록이나 기준 위치가 바뀔 때만 핀을 다시 그리고 지도를 맞춰요.
  useEffect(() => {
    const ctx = mapRef.current;
    if (status !== 'ready' || !ctx) return;
    const { maps, map } = ctx;

    const me = new maps.LatLng(center.lat, center.lng);
    const bounds = new maps.LatLngBounds();
    bounds.extend(me);

    const overlays: KakaoMarker[] = [];
    const meDot = document.createElement('div');
    meDot.className = 'map-me';
    overlays.push(new maps.CustomOverlay({ position: me, content: meDot, map }));

    const pins = pinsRef.current;
    pins.clear();
    for (const p of places) {
      const pos = new maps.LatLng(p.lat, p.lng);
      bounds.extend(pos);
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = `map-pin map-pin-${p.category}`;
      pin.textContent = p.category === 'cafe' ? '☕' : '🍽️';
      pin.title = p.name;
      pin.setAttribute('aria-label', p.name);
      pin.onclick = () => onSelectRef.current(p.id);
      pins.set(p.id, pin);
      overlays.push(new maps.CustomOverlay({ position: pos, content: pin, map, yAnchor: 0.5, clickable: true }));
    }

    if (places.length > 0) map.setBounds(bounds);
    else map.setCenter(me);

    return () => overlays.forEach((o) => o.setMap(null));
  }, [status, center, places]);

  // 고른 핀만 강조
  useEffect(() => {
    for (const [id, pin] of pinsRef.current) pin.classList.toggle('is-selected', id === selectedId);
  }, [selectedId, places, status]);

  if (status === 'error') {
    return (
      <div className="map-placeholder">
        <p>🗺️ 지도를 불러오지 못했어요.</p>
        <p className="muted">잠시 후 다시 시도하거나 목록 탭에서 찾아보세요.</p>
      </div>
    );
  }

  return <div ref={containerRef} className="map" aria-label="주변 가게 지도" />;
}
