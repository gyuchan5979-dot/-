import { formatDistance } from '../lib/geo';
import { openExternal } from '../lib/location';
import type { PlaceWithDistance } from '../types';
import { PET_AREA_LABEL } from '../labels';

interface Props {
  place: PlaceWithDistance;
  onClose: () => void;
}

export function PlaceDetail({ place, onClose }: Props) {
  const directionsUrl = `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <h2 id="sheet-title">{place.name}</h2>
        <p className="muted">
          {place.category === 'cafe' ? '카페' : '식당'} · {formatDistance(place.distanceM)} · {place.address}
        </p>

        <dl className="facts">
          <div>
            <dt>동반 범위</dt>
            <dd>{PET_AREA_LABEL[place.petArea]}</dd>
          </div>
          <div>
            <dt>입장 가능 크기</dt>
            <dd>{place.sizeNote ?? (place.largeDogOk ? '가능' : '불가 (소·중형견만)')}</dd>
          </div>
          {place.restriction && (
            <div>
              <dt>제한사항</dt>
              <dd>{place.restriction}</dd>
            </div>
          )}
          {place.amenities.length > 0 && (
            <div>
              <dt>편의</dt>
              <dd>{place.amenities.join(', ')}</dd>
            </div>
          )}
          <div>
            <dt>정보 작성일</dt>
            <dd>{place.verifiedAt ?? '확인 기록 없음'}</dd>
          </div>
        </dl>

        <p className="notice">방문 전에 가게에 동반 가능 여부를 한 번 더 확인해 주세요.</p>

        <div className="sheet-actions">
          <button type="button" className="btn btn-primary" onClick={() => openExternal(directionsUrl)}>
            카카오맵 길찾기
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => alert('정보 제보 기능은 준비 중이에요.')}
          >
            정보가 달라요
          </button>
        </div>
      </section>
    </div>
  );
}
