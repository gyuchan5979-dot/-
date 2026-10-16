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
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error('kakao maps not available'));
        return;
      }
      maps.load(() => resolve(maps));
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

    for (const p of places) {
      const pos = new maps.LatLng(p.lat, p.lng);
      bounds.extend(pos);
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = `map-pin${p.id === selectedId ? ' is-selected' : ''}`;
      pin.textContent = p.category === 'cafe' ? '☕' : '🍽';
      pin.title = p.name;
      pin.onclick = () => onSelect(p.id);
      overlays.push(new maps.CustomOverlay({ position: pos, content: pin, map, yAnchor: 1 }));
    }

    if (places.length > 0) map.setBounds(bounds);
    else map.setCenter(me);

    return () => overlays.forEach((o) => o.setMap(null));
  }, [status, center, places, selectedId, onSelect]);

  if (status === 'error') {
    return (
      <div className="map-placeholder">
        <p>🗺️ 지도를 표시하려면 카카오맵 JavaScript 키가 필요해요.</p>
        <p className="muted">
          <code>.env.local</code>에 <code>VITE_KAKAO_MAP_KEY</code>를 넣고, 카카오 개발자 콘솔에 도메인을 등록하세요.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="map" aria-label="주변 가게 지도" />;
}
