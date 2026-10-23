import { useEffect, useMemo, useState } from 'react';
import { loadSearchIndex, searchIndex, type AreaHit, type PlaceHit } from '../lib/search';

interface Props {
  autoFocus?: boolean;
  onChooseArea: (area: AreaHit) => void;
  onChoosePlace: (place: PlaceHit) => void;
  /** 검색어가 있는지 (있으면 바깥에서 지역 버튼을 숨겨요) */
  onActiveChange?: (active: boolean) => void;
}

type Index = Awaited<ReturnType<typeof loadSearchIndex>>;

/** 동네(시군구·읍면동)나 가게 이름으로 찾기 */
export function PlaceSearch({ autoFocus, onChooseArea, onChoosePlace, onActiveChange }: Props) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<Index>(null);
  const [loading, setLoading] = useState(false);

  // 검색창을 처음 쓸 때 목록을 받아요.
  const ensureIndex = () => {
    if (index || loading) return;
    setLoading(true);
    loadSearchIndex().then((i) => {
      setIndex(i);
      setLoading(false);
    });
  };

  useEffect(() => {
    onActiveChange?.(query.trim().length > 0);
  }, [query, onActiveChange]);

  const results = useMemo(() => (index ? searchIndex(index, query) : { areas: [], places: [] }), [index, query]);
  const active = query.trim().length > 0;
  const empty = active && index && results.areas.length === 0 && results.places.length === 0;

  return (
    <div className="search">
      <label className="search-box">
        <span aria-hidden="true">🔍</span>
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          placeholder="동네나 가게 이름 (예: 성수동, 진접읍)"
          value={query}
          autoFocus={autoFocus}
          onFocus={ensureIndex}
          onChange={(e) => {
            ensureIndex();
            setQuery(e.target.value);
          }}
          aria-label="동네나 가게 이름 검색"
        />
        {query && (
          <button type="button" className="search-clear" aria-label="검색어 지우기" onClick={() => setQuery('')}>
            ✕
          </button>
        )}
      </label>

      {active && (
        <div className="search-results" role="listbox" aria-label="검색 결과">
          {!index && <p className="search-hint">🐾 찾는 중…</p>}
          {empty && <p className="search-hint">🐶 '{query.trim()}'(으)로 찾은 곳이 없어요. 동네 이름으로 찾아보세요.</p>}
          {results.areas.map((a) => (
            <button key={a.label} type="button" className="search-item" onClick={() => onChooseArea(a)}>
              <span className="search-icon">📍</span>
              <span className="search-main">{a.label}</span>
              <span className="search-sub">{a.count}곳</span>
            </button>
          ))}
          {results.places.map((p) => (
            <button key={p.id} type="button" className="search-item" onClick={() => onChoosePlace(p)}>
              <span className="search-icon">🐾</span>
              <span className="search-main">{p.name}</span>
              <span className="search-sub">{p.where}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
