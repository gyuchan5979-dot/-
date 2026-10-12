import { useCallback, useEffect, useMemo, useState } from 'react';
import { KakaoMap } from './components/KakaoMap';
import { PlaceDetail } from './components/PlaceDetail';
import { SubmitPlaceSheet } from './components/SubmitPlaceSheet';
import { distanceMeters, formatDistance } from './lib/geo';
import { getMyLocation, hasLocationPermission, REGIONS, regionLocation, type LocationResult } from './lib/location';
import { loadPlacesNear, type PlacesResult } from './lib/places';
import { reportingEnabled } from './lib/reports';
import { PET_AREA_LABEL } from './labels';
import type { Category, PlaceWithDistance } from './types';

const RADIUS_OPTIONS = [1000, 3000, 5000] as const;
/** 카카오맵 키가 있을 때만 지도 탭을 보여줘요 */
const MAP_ENABLED = Boolean(import.meta.env.VITE_KAKAO_MAP_KEY);
const MAX_RADIUS = RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1];
/** 목록에 한 번에 그리는 최대 개수 */
const LIST_LIMIT = 100;

type CategoryFilter = 'all' | Category;

export default function App() {
  const [location, setLocation] = useState<LocationResult | null>(null);
  /** 위치 권한 설명·지역 선택 화면을 보여줄지 */
  const [choosing, setChoosing] = useState(false);
  const [locating, setLocating] = useState(true);
  const [radius, setRadius] = useState<number>(3000);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [largeDogOnly, setLargeDogOnly] = useState(false);
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<PlacesResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const locate = useCallback(() => {
    setChoosing(false);
    setLocating(true);
    getMyLocation().then((result) => {
      setLocating(false);
      setLocation(result);
      // 권한을 거부했으면 지역을 직접 고를 수 있게 해요.
      if (result.source === 'default') setChoosing(true);
    });
  }, []);

  const chooseRegion = useCallback((region: (typeof REGIONS)[number]) => {
    setChoosing(false);
    setLocation(regionLocation(region));
  }, []);

  // 이미 위치를 허용한 사용자만 바로 위치를 받아요. 처음이면 설명 화면부터 보여줘요.
  useEffect(() => {
    hasLocationPermission().then((allowed) => {
      if (allowed) {
        getMyLocation().then((result) => {
          setLocating(false);
          setLocation(result);
        });
      } else {
        setLocating(false);
        setChoosing(true);
      }
    });
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
        <div className="header-top">
          <h1>🐾 우리 댕댕이랑 갈 곳</h1>
          {reportingEnabled && location && (
            <button type="button" className="btn btn-small" onClick={() => setSubmitting(true)}>
              + 장소 제보
            </button>
          )}
        </div>
        <LocationStatus location={location} onRetry={locate} onChoose={() => setChoosing(true)} />
      </header>

      {choosing && (
        <LocationPicker
          denied={location?.source === 'default' && location.denied}
          onUseMyLocation={locate}
          onChooseRegion={chooseRegion}
        />
      )}

      {location && (
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
      )}

      {MAP_ENABLED && (
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}>
            목록 {data && <span className="count">{places.length}</span>}
          </button>
          <button role="tab" aria-selected={view === 'map'} onClick={() => setView('map')}>
            지도
          </button>
        </div>
      )}
      {!MAP_ENABLED && data && location && (
        <p className="result-count">
          {location.label ?? '내 주변'} {radius / 1000}km 안에 <strong>{places.length}곳</strong>
        </p>
      )}

      <main>
        {!location ? (
          locating ? <p className="empty">📍 현재 위치를 확인하고 있어요…</p> : null
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
            <div className="empty-actions">
              {radius < MAX_RADIUS && (
                <button type="button" className="btn" onClick={() => setRadius(MAX_RADIUS)}>
                  {MAX_RADIUS / 1000}km로 넓혀 보기
                </button>
              )}
              {reportingEnabled && (
                <button type="button" className="btn" onClick={() => setSubmitting(true)}>
                  아는 곳 제보하기
                </button>
              )}
            </div>
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
                    {p.official && <span className="tag tag-official">✓ 식약처 등록</span>}
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

      {data && (
      <footer className="footer muted">
        {data.source === 'public-data' ? (
          <>
            출처: {data.sourceLabels.join(', ')}
            <br />
            방문 전 동반 가능 여부를 가게에 꼭 확인해 주세요.
          </>
        ) : (
          '지금은 샘플 데이터로 보여주고 있어요. 실제 가게 정보가 아니에요.'
        )}
      </footer>
      )}

      {selected && <PlaceDetail place={selected} onClose={() => setSelectedId(null)} onToast={setToast} />}
      {submitting && location && (
        <SubmitPlaceSheet
          coords={location.coords}
          hasRealLocation={location.source === 'toss' || location.source === 'browser'}
          onClose={() => setSubmitting(false)}
          onToast={setToast}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
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

function LocationStatus({
  location,
  onRetry,
  onChoose,
}: {
  location: LocationResult | null;
  onRetry: () => void;
  onChoose: () => void;
}) {
  if (!location) return null;
  let text = '현재 위치 기준';
  if (location.source === 'region') text = `${location.label} 기준`;
  if (location.source === 'default') {
    text = location.denied ? '위치 권한이 없어 서울 시청 기준으로 보여드려요' : '위치를 못 찾아 서울 시청 기준으로 보여드려요';
  }
  return (
    <p className="location-status">
      📍 {text}
      {location.source !== 'region' && (
        <button type="button" className="link" onClick={onRetry}>
          새로고침
        </button>
      )}
      <button type="button" className="link" onClick={onChoose}>
        지역 바꾸기
      </button>
    </p>
  );
}

function LocationPicker({
  denied,
  onUseMyLocation,
  onChooseRegion,
}: {
  denied: boolean;
  onUseMyLocation: () => void;
  onChooseRegion: (region: (typeof REGIONS)[number]) => void;
}) {
  return (
    <section className="picker" aria-label="위치 선택">
      <h2>어디 근처를 찾아볼까요?</h2>
      <p className="muted">
        내 위치를 쓰면 가까운 순서로 보여드려요. 위치는 이 기기에서 거리를 계산할 때만 쓰고, 저장하거나 보내지 않아요.
      </p>
      {denied && <p className="notice">위치 권한이 꺼져 있어요. 아래에서 지역을 골라 둘러볼 수 있어요.</p>}
      <button type="button" className="btn btn-primary btn-block" onClick={onUseMyLocation}>
        📍 내 위치로 찾기
      </button>
      <p className="picker-label">또는 지역 고르기</p>
      <div className="chips chips-inline">
        {REGIONS.map((r) => (
          <button key={r.label} type="button" className="chip" onClick={() => onChooseRegion(r)}>
            {r.label}
          </button>
        ))}
      </div>
    </section>
  );
}
