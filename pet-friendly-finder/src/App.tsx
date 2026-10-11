import { useCallback, useEffect, useMemo, useState } from 'react';
import { KakaoMap } from './components/KakaoMap';
import { PlaceDetail } from './components/PlaceDetail';
import { distanceMeters, formatDistance } from './lib/geo';
import { getMyLocation, type LocationResult } from './lib/location';
import { loadPlacesNear, type PlacesResult } from './lib/places';
import { PET_AREA_LABEL } from './labels';
import type { Category, PlaceWithDistance } from './types';

const RADIUS_OPTIONS = [1000, 3000, 5000] as const;
const MAX_RADIUS = RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1];
/** 목록에 한 번에 그리는 최대 개수 */
const LIST_LIMIT = 100;

type CategoryFilter = 'all' | Category;

export default function App() {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [radius, setRadius] = useState<number>(3000);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [largeDogOnly, setLargeDogOnly] = useState(false);
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<PlacesResult | null>(null);

  const refreshLocation = useCallback(() => {
    setLocation(null);
    getMyLocation().then(setLocation);
  }, []);

  useEffect(() => {
    getMyLocation().then(setLocation);
  }, []);

  // 위치가 정해지면 가장 넓은 반경 기준으로 한 번 불러오고, 반경 변경은 화면에서 거르기만 해요.
  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    loadPlacesNear(location.coords, MAX_RADIUS).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [location]);

  const places = useMemo<PlaceWithDistance[]>(() => {
    if (!location || !data) return [];
    return data.places.map((p) => ({ ...p, distanceM: distanceMeters(location.coords, p) }))
      .filter((p) => p.distanceM <= radius)
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => !largeDogOnly || p.largeDogOk)
      .filter((p) => !indoorOnly || p.petArea === 'indoor')
      .sort((a, b) => a.distanceM - b.distanceM);
  }, [location, data, radius, category, largeDogOnly, indoorOnly]);

  const selected = places.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="app">
      <header className="header">
        <h1>🐾 우리 댕댕이랑 갈 곳</h1>
        <LocationStatus location={location} onRetry={refreshLocation} />
      </header>

      <div className="filters">
        <div className="chips" role="group" aria-label="반경">
          {RADIUS_OPTIONS.map((r) => (
            <Chip key={r} active={radius === r} onClick={() => setRadius(r)}>
              {r / 1000}km
            </Chip>
          ))}
        </div>
        <div className="chips" role="group" aria-label="종류와 조건">
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>전체</Chip>
          <Chip active={category === 'restaurant'} onClick={() => setCategory('restaurant')}>🍽 식당</Chip>
          <Chip active={category === 'cafe'} onClick={() => setCategory('cafe')}>☕ 카페</Chip>
          <Chip active={largeDogOnly} onClick={() => setLargeDogOnly((v) => !v)}>🐕 대형견 가능</Chip>
          <Chip active={indoorOnly} onClick={() => setIndoorOnly((v) => !v)}>🏠 실내 동반</Chip>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}>
          목록 {data && <span className="count">{places.length}</span>}
        </button>
        <button role="tab" aria-selected={view === 'map'} onClick={() => setView('map')}>
          지도
        </button>
      </div>

      <main>
        {!location ? (
          <p className="empty">📍 현재 위치를 확인하고 있어요…</p>
        ) : !data ? (
          <p className="empty">🐾 주변 가게를 불러오고 있어요…</p>
        ) : view === 'map' ? (
          <KakaoMap
            center={location.coords}
            places={places}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : places.length === 0 ? (
          <div className="empty">
            <p>반경 {radius / 1000}km 안에 조건에 맞는 곳이 없어요.</p>
            {radius < 5000 && (
              <button type="button" className="btn" onClick={() => setRadius(5000)}>
                5km로 넓혀 보기
              </button>
            )}
          </div>
        ) : (
          <ul className="list">
            {places.slice(0, LIST_LIMIT).map((p) => (
              <li key={p.id}>
                <button type="button" className="card" onClick={() => setSelectedId(p.id)}>
                  <div className="card-top">
                    <span className="card-name">{p.name}</span>
                    <span className="card-dist">{formatDistance(p.distanceM)}</span>
                  </div>
                  <div className="card-meta">
                    {p.category === 'cafe' ? '카페' : '식당'} · {p.address}
                  </div>
                  <div className="tags">
                    <span className={`tag tag-${p.petArea}`}>{PET_AREA_LABEL[p.petArea]}</span>
                    {p.largeDogOk && <span className="tag tag-large">대형견 OK</span>}
                    {p.amenities.slice(0, 2).map((a) => (
                      <span key={a} className="tag">{a}</span>
                    ))}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {view === 'list' && places.length > LIST_LIMIT && (
          <p className="empty">가까운 {LIST_LIMIT}곳만 보여드려요. 반경을 줄이거나 조건을 더해 보세요.</p>
        )}
      </main>

      <footer className="footer muted">
        {data?.source === 'public-data' ? (
          <>
            출처: 한국문화정보원 「전국 반려동물 동반 가능 문화시설 위치 데이터」 (공공누리)
            <br />
            방문 전 동반 가능 여부를 가게에 꼭 확인해 주세요.
          </>
        ) : (
          '지금은 샘플 데이터로 보여주고 있어요. 실제 가게 정보가 아니에요.'
        )}
      </footer>

      {selected && <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={`chip${active ? ' is-active' : ''}`} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

function LocationStatus({ location, onRetry }: { location: LocationResult | null; onRetry: () => void }) {
  if (!location) return null;
  let text = '현재 위치 기준';
  if (location.source === 'default') {
    text = location.denied
      ? '위치 권한이 없어 서울시청 기준으로 보여드려요'
      : '위치를 못 찾아 서울시청 기준으로 보여드려요';
  }
  return (
    <p className="location-status">
      📍 {text}
      <button type="button" className="link" onClick={onRetry}>
        새로고침
      </button>
    </p>
  );
}
