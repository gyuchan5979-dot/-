import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DogSizeSheet } from './components/DogSizeSheet';
import { KakaoMap } from './components/KakaoMap';
import { Mascot } from './components/Mascot';
import { PlaceDetail } from './components/PlaceDetail';
import { PlaceSearch } from './components/PlaceSearch';
import { SubmitPlaceSheet } from './components/SubmitPlaceSheet';
import { Environment } from '@apps-in-toss/web-framework';
import { useBackHandler } from './lib/back';
import { DOG_SIZE_LABEL, fitsDog, useDogSize } from './lib/dogSize';
import { distanceMeters, formatDistance } from './lib/geo';
import { getMyLocation, hasLocationPermission, REGIONS, regionLocation, type LocationResult } from './lib/location';
import { useFavorites } from './lib/favorites';
import { loadPlacesNear, type PlacesResult } from './lib/places';
import { requirementsOf } from './lib/requirements';
import { shortAreaLabel, type AreaHit, type PlaceHit } from './lib/search';
import { parseSharedPlace, type SharedPlace } from './lib/share';
import { reportingEnabled } from './lib/reports';
import { PET_AREA_ICON, PET_AREA_LABEL } from './labels';
import type { Category, PlaceWithDistance } from './types';

const RADIUS_OPTIONS = [1000, 3000, 5000] as const;
/** 카카오맵 키가 있을 때만 지도 탭을 보여줘요 */
const MAP_ENABLED = Boolean(import.meta.env.VITE_KAKAO_MAP_KEY);
const MAX_RADIUS = RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1];
/** 목록에 한 번에 그리는 최대 개수 */
const LIST_LIMIT = 100;

type CategoryFilter = 'all' | Category;

export default function App() {
  /** 공유 링크로 열렸으면 그 가게 (처음 한 번만 읽어요) */
  const [sharedAtStart] = useState(readSharedPlace);
  const [location, setLocation] = useState<LocationResult | null>(() =>
    sharedAtStart ? { coords: sharedAtStart.coords, source: 'region', denied: false, label: '공유받은 곳 근처' } : null,
  );
  /**
   * 지역 선택 화면
   * - initial: 처음 화면(여기서 뒤로가기 = 미니앱 종료)
   * - change: '지역 바꾸기'로 연 경우(뒤로가기 = 닫기)
   */
  const [pickerMode, setPickerMode] = useState<'initial' | 'change' | null>(null);
  /** 처음 지역 선택 화면에서 골라 목록으로 넘어왔는지 (뒤로가기 = 지역 선택으로 돌아가기) */
  const [fromInitialPicker, setFromInitialPicker] = useState(false);
  const [locating, setLocating] = useState(!sharedAtStart);
  const [radius, setRadius] = useState<number>(3000);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [dogSize, setDogSize] = useDogSize();
  const [sizeSheet, setSizeSheet] = useState(false);
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  /** 상세를 연 장소 (찜 해제 등으로 목록에서 빠져도 시트가 갑자기 닫히지 않게 통째로 기억해요) */
  const [selected, setSelected] = useState<PlaceWithDistance | null>(null);
  const selectedId = selected?.id ?? null;
  const [showFavorites, setShowFavorites] = useState(false);
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();
  const [data, setData] = useState<PlacesResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const locate = useCallback(() => {
    if (pickerMode === 'initial') setFromInitialPicker(true);
    setPickerMode(null);
    setLocating(true);
    getMyLocation().then((result) => {
      setLocating(false);
      setLocation(result);
      // 권한을 거부했으면 지역을 직접 고를 수 있게 해요.
      if (result.source === 'default') {
        setFromInitialPicker(false);
        setPickerMode('initial');
      }
    });
  }, [pickerMode]);

  const chooseRegion = useCallback(
    (region: (typeof REGIONS)[number]) => {
      if (pickerMode === 'initial') setFromInitialPicker(true);
      setPickerMode(null);
      setLocation(regionLocation(region));
    },
    [pickerMode],
  );

  /** 검색에서 가게를 골랐을 때: 그 근처 데이터를 받은 뒤 상세를 열어요. */
  const pendingSelectId = useRef<string | null>(sharedAtStart?.id ?? null);

  const chooseArea = useCallback(
    (area: AreaHit) => chooseRegion({ label: shortAreaLabel(area.label), coords: area.coords }),
    [chooseRegion],
  );

  const choosePlace = useCallback(
    (hit: PlaceHit) => {
      pendingSelectId.current = hit.id;
      setShowFavorites(false);
      chooseRegion({ label: `${hit.name} 근처`, coords: hit.coords });
    },
    [chooseRegion],
  );

  // 뒤로가기: 열린 것부터 닫아요. 가장 나중에 열린 것이 먼저 닫혀요. (자세한 규칙은 lib/back.ts)
  useBackHandler(fromInitialPicker && pickerMode !== 'initial', () => {
    setFromInitialPicker(false);
    setPickerMode('initial');
  });
  useBackHandler(pickerMode === 'change', () => setPickerMode(null));
  useBackHandler(selected !== null, () => setSelected(null));
  useBackHandler(submitting, () => setSubmitting(false));
  useBackHandler(sizeSheet, () => setSizeSheet(false));

  // 공유 링크로 들어왔으면 그 가게 근처로 바로 가서 상세를 열어요.
  // 아니면: 이미 위치를 허용한 사용자만 바로 위치를 받고, 처음이면 설명 화면부터 보여줘요.
  useEffect(() => {
    if (sharedAtStart) return;
    hasLocationPermission().then((allowed) => {
      if (allowed) {
        getMyLocation().then((result) => {
          setLocating(false);
          setLocation(result);
        });
      } else {
        setLocating(false);
        setPickerMode('initial');
      }
    });
  }, [sharedAtStart]);

  // 위치가 정해지면 가장 넓은 반경 기준으로 한 번 불러오고, 반경 변경은 화면에서 거르기만 해요.
  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    loadPlacesNear(location.coords, MAX_RADIUS).then((result) => {
      if (cancelled) return;
      setData(result);
      const id = pendingSelectId.current;
      if (id) {
        pendingSelectId.current = null;
        const place = result.places.find((p) => p.id === id);
        if (place) setSelected({ ...place, distanceM: distanceMeters(location.coords, place) });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [location]);

  const places = useMemo<PlaceWithDistance[]>(() => {
    if (!location) return [];
    // 찜 목록은 거리와 상관없이 다 보여줘요.
    const base = showFavorites ? favorites : (data?.places ?? []);
    return base
      .map((p) => ({ ...p, distanceM: distanceMeters(location.coords, p) }))
      .filter((p) => showFavorites || p.distanceM <= radius)
      .filter((p) => category === 'all' || p.category === category)
      // 우리 아이 크기를 정했으면 확실히 못 들어가는 곳만 빼요. (정보 없는 곳은 '크기 문의'로 남겨요)
      .filter((p) => !dogSize || fitsDog(p, dogSize) !== 'no')
      .filter((p) => !indoorOnly || p.petArea === 'indoor')
      .sort((a, b) => a.distanceM - b.distanceM);
  }, [location, data, favorites, showFavorites, radius, category, dogSize, indoorOnly]);

  const onToggleFavorite = (place: PlaceWithDistance) => {
    setToast(toggleFavorite(place) ? '찜했어요 ❤️' : '찜을 해제했어요');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="brand">
            <Mascot size={52} className="brand-mascot" />
            <div>
              <h1>댕댕이랑 갈 곳</h1>
              <p className="brand-sub">우리 강아지랑 같이 들어갈 수 있는 곳 🐾</p>
            </div>
          </div>
          {reportingEnabled && location && (
            <button type="button" className="btn btn-small" onClick={() => setSubmitting(true)}>
              + 장소 제보
            </button>
          )}
        </div>
        <LocationStatus location={location} onRetry={locate} onChoose={() => setPickerMode('change')} />
      </header>

      {pickerMode && (
        <LocationPicker
          denied={location?.source === 'default' && location.denied}
          onUseMyLocation={locate}
          onChooseRegion={chooseRegion}
          onChooseArea={chooseArea}
          onChoosePlace={choosePlace}
          autoFocusSearch={pickerMode === 'change'}
        />
      )}

      {location && (
      <div className="filters">
        <div className="chips" role="group" aria-label="반경">
          <Chip active={showFavorites} onClick={() => setShowFavorites((v) => !v)}>
            ❤️ 찜한 곳{favorites.length > 0 ? ` ${favorites.length}` : ''}
          </Chip>
          {RADIUS_OPTIONS.map((r) => (
            <Chip
              key={r}
              active={!showFavorites && radius === r}
              onClick={() => {
                setShowFavorites(false);
                setRadius(r);
              }}
            >
              {r / 1000}km
            </Chip>
          ))}
        </div>
        <div className="chips" role="group" aria-label="종류와 조건">
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>전체</Chip>
          <Chip active={category === 'restaurant'} onClick={() => setCategory('restaurant')}>🍽 식당</Chip>
          <Chip active={category === 'cafe'} onClick={() => setCategory('cafe')}>☕ 카페</Chip>
          <Chip active={dogSize !== null} onClick={() => setSizeSheet(true)}>
            🐶 {dogSize ? `우리 아이: ${DOG_SIZE_LABEL[dogSize]}` : '우리 아이 크기'}
          </Chip>
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
      {data && location && (
        <p className="result-count">
          {showFavorites ? (
            <>
              ❤️ 찜한 곳 <strong>{places.length}곳</strong>
            </>
          ) : (
            <>
              🐶 {location.label ?? '내 주변'} {radius / 1000}km 안에 <strong>{places.length}곳</strong>
              {places.length > 0 ? ' 있어요!' : ''}
            </>
          )}
        </p>
      )}

      <main>
        {!location ? (
          locating ? <Loading text="킁킁… 지금 어디 있는지 찾고 있어요" /> : null
        ) : !data ? (
          <Loading text="킁킁… 주변 가게 냄새를 맡고 있어요" />
        ) : view === 'map' ? (
          <KakaoMap
            center={location.coords}
            places={places}
            selectedId={selectedId}
            onSelect={(id) => setSelected(places.find((p) => p.id === id) ?? null)}
          />
        ) : places.length === 0 && showFavorites ? (
          <div className="empty">
            <Mascot size={88} />
            <p>
              {favorites.length === 0 ? '아직 찜한 곳이 없어요.' : '조건에 맞는 찜한 곳이 없어요.'}
              <br />
              마음에 드는 가게를 눌러 ❤️ 찜해 보세요!
            </p>
          </div>
        ) : places.length === 0 ? (
          <div className="empty">
            <Mascot size={88} mood="sad" />
            <p>
              앗, 반경 {radius / 1000}km 안에는 조건에 맞는 곳이 없어요.
              <br />
              조금 더 멀리 산책해 볼까요?
            </p>
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
                <button type="button" className="card" onClick={() => setSelected(p)}>
                  <span className={`card-icon card-icon-${p.category}`} aria-hidden="true">
                    {p.category === 'cafe' ? '☕' : '🍽️'}
                  </span>
                  <div className="card-body">
                  <div className="card-top">
                    <span className="card-name">
                      {isFavorite(p.id) && <span className="card-fav" aria-label="찜한 곳">❤️ </span>}
                      {p.name}
                    </span>
                    <span className="card-dist">{formatDistance(p.distanceM)}</span>
                  </div>
                  <div className="card-meta">
                    {p.category === 'cafe' ? '카페' : '식당'} · {p.address}
                  </div>
                  <div className="tags">
                    {p.official && <span className="tag tag-official">✓ 식약처 등록</span>}
                    <span className={`tag tag-${p.petArea}`}>
                      {PET_AREA_ICON[p.petArea]} {PET_AREA_LABEL[p.petArea]}
                    </span>
                    {dogSize ? (
                      fitsDog(p, dogSize) === 'yes' ? (
                        <span className="tag tag-large">🐶 우리 아이 OK</span>
                      ) : (
                        <span className="tag tag-ask">📏 크기 문의</span>
                      )
                    ) : (
                      p.largeDogOk && <span className="tag tag-large">🐕 대형견 OK</span>
                    )}
                    {requirementsOf(p)
                      // 식약처 등록 업소는 모두 '예방접종' 기준이라 카드에서는 빼고 상세에서만 보여줘요.
                      .filter((r) => !(p.official && r.key === 'vaccine'))
                      .slice(0, 2)
                      .map((r) => (
                        <span key={r.key} className="tag tag-req">
                          {r.icon} {r.label}
                        </span>
                      ))}
                    {p.amenities.slice(0, 2).map((a) => (
                      <span key={a} className="tag">{a}</span>
                    ))}
                  </div>
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
            🐾 출처: {data.sourceLabels.join(', ')}
            <br />
            방문 전 동반 가능 여부를 가게에 꼭 확인해 주세요.
          </>
        ) : (
          '지금은 샘플 데이터로 보여주고 있어요. 실제 가게 정보가 아니에요.'
        )}
      </footer>
      )}

      {selected && (
        <PlaceDetail
          place={selected}
          favorite={isFavorite(selected.id)}
          onToggleFavorite={() => onToggleFavorite(selected)}
          onClose={() => setSelected(null)}
          onToast={setToast}
        />
      )}
      {sizeSheet && <DogSizeSheet value={dogSize} onChange={setDogSize} onClose={() => setSizeSheet(false)} />}
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
        🔍 검색·지역 바꾸기
      </button>
    </p>
  );
}

function LocationPicker({
  denied,
  onUseMyLocation,
  onChooseRegion,
  onChooseArea,
  onChoosePlace,
  autoFocusSearch,
}: {
  denied: boolean;
  onUseMyLocation: () => void;
  onChooseRegion: (region: (typeof REGIONS)[number]) => void;
  onChooseArea: (area: AreaHit) => void;
  onChoosePlace: (place: PlaceHit) => void;
  autoFocusSearch: boolean;
}) {
  const [searching, setSearching] = useState(false);
  return (
    <section className="picker" aria-label="위치 선택">
      <div className="picker-hero">
        <Mascot size={84} />
        <p className="bubble">오늘은 어디로 같이 갈까요?</p>
      </div>
      <h2>어디 근처를 찾아볼까요?</h2>
      <p className="muted">
        내 위치를 쓰면 가까운 순서로 보여드려요. 위치는 이 기기에서 거리를 계산할 때만 쓰고, 저장하거나 보내지 않아요.
      </p>
      {denied && <p className="notice">위치 권한이 꺼져 있어요. 아래에서 지역을 골라 둘러볼 수 있어요.</p>}
      <button type="button" className="btn btn-primary btn-block" onClick={onUseMyLocation}>
        📍 내 위치로 찾기
      </button>
      <p className="picker-label">또는 동네·가게 이름으로 찾기</p>
      <PlaceSearch
        autoFocus={autoFocusSearch}
        onChooseArea={onChooseArea}
        onChoosePlace={onChoosePlace}
        onActiveChange={setSearching}
      />
      {!searching && (
        <>
          <p className="picker-label">인기 지역</p>
          <div className="chips chips-inline">
            {REGIONS.map((r) => (
              <button key={r.label} type="button" className="chip" onClick={() => onChooseRegion(r)}>
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div className="empty loading" role="status">
      <Mascot size={88} mood="sniff" className="mascot-bob" />
      <div className="paws" aria-hidden="true">
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
      </div>
      <p>{text}</p>
    </div>
  );
}

/** 공유 링크(intoss://...?place=..)로 열렸는지. 토스 앱은 처음 연 주소를 따로 알려줘요. */
function readSharedPlace(): SharedPlace | null {
  const fromPage = parseSharedPlace(window.location.search);
  if (fromPage) return fromPage;
  try {
    const initial = Environment.initialURL;
    const q = initial.indexOf('?');
    return q >= 0 ? parseSharedPlace(initial.slice(q)) : null;
  } catch {
    return null;
  }
}
