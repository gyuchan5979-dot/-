import { useState } from 'react';
import { useBackHandler } from '../lib/back';
import { formatDistance } from '../lib/geo';
import { openExternal } from '../lib/location';
import { kakaoDirectionsUrl, naverDirectionsUrl } from '../lib/mapLinks';
import { requirementsOf } from '../lib/requirements';
import { sharePlace } from '../lib/share';
import { REPORT_KIND_LABEL, reportPlace, reportingEnabled, type ReportKind, type SubmitResult } from '../lib/reports';
import type { PlaceWithDistance } from '../types';
import { PET_AREA_ICON, PET_AREA_LABEL, SOURCE_LABEL } from '../labels';
import { Sheet } from './Sheet';

interface Props {
  place: PlaceWithDistance;
  favorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onToast: (message: string) => void;
}

export function PlaceDetail({ place, favorite, onToggleFavorite, onClose, onToast }: Props) {
  const requirements = requirementsOf(place);
  const [reporting, setReporting] = useState(false);
  // 신고 화면에서 뒤로가기 → 가게 상세로 돌아가기
  useBackHandler(reporting, () => setReporting(false));

  if (reporting) {
    return (
      <Sheet title="어떤 정보가 다른가요?" onClose={onClose}>
        <ReportForm
          place={place}
          onCancel={() => setReporting(false)}
          onDone={(message) => {
            onToast(message);
            onClose();
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet title={place.name} onClose={onClose}>
      <p className="muted">
        {place.category === 'cafe' ? '카페' : '식당'} · {formatDistance(place.distanceM)} · {place.address}
      </p>

      <div className="quick-actions">
        <button
          type="button"
          className={`btn quick${favorite ? ' is-on' : ''}`}
          aria-pressed={favorite}
          onClick={onToggleFavorite}
        >
          {favorite ? '❤️ 찜했어요' : '🤍 찜하기'}
        </button>
        <button
          type="button"
          className="btn quick"
          onClick={async () => {
            const result = await sharePlace(place);
            if (result === 'copied') onToast('공유할 내용을 복사했어요 📋');
            else if (result === 'failed') onToast('공유하지 못했어요. 잠시 후 다시 시도해 주세요.');
          }}
        >
          📤 공유
        </button>
        {place.phone && (
          <button type="button" className="btn quick" onClick={() => openExternal(`tel:${place.phone!.replace(/[^0-9+]/g, '')}`)}>
            📞 전화하기
          </button>
        )}
      </div>

      {place.official && (
        <p className="official-note">
          ✓ 식약처 「반려동물 동반출입 음식점」으로 지자체에 등록된 곳이에요.
        </p>
      )}

      {requirements.length > 0 && (
        <div className="bring">
          <p className="bring-title">🎒 방문 전에 챙겨요</p>
          <div className="tags">
            {requirements.map((r) => (
              <span key={r.key} className="tag tag-req">
                {r.icon} {r.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <dl className="facts">
        <div>
          <dt>{PET_AREA_ICON[place.petArea]} 동반 범위</dt>
          <dd>{PET_AREA_LABEL[place.petArea]}</dd>
        </div>
        <div>
          <dt>🐕 입장 가능 크기</dt>
          <dd>{place.sizeNote ?? (place.largeDogOk ? '가능' : '불가 (소·중형견만)')}</dd>
        </div>
        {place.restriction && (
          <div>
            <dt>📌 제한사항</dt>
            <dd>{place.restriction}</dd>
          </div>
        )}
        {place.amenities.length > 0 && (
          <div>
            <dt>🥣 편의</dt>
            <dd>{place.amenities.join(', ')}</dd>
          </div>
        )}
        {place.hours && (
          <div>
            <dt>⏰ 영업시간</dt>
            <dd>{place.hours}</dd>
          </div>
        )}
        {place.closedDays && (
          <div>
            <dt>💤 휴무일</dt>
            <dd>{place.closedDays}</dd>
          </div>
        )}
        {place.parking !== undefined && (
          <div>
            <dt>🅿️ 주차</dt>
            <dd>{place.parking ? '가능' : '불가'}</dd>
          </div>
        )}
        <div>
          <dt>🗓️ 정보 작성일</dt>
          <dd>{place.verifiedAt ?? '확인 기록 없음'}</dd>
        </div>
        {place.source && SOURCE_LABEL[place.source] && (
          <div>
            <dt>📚 출처</dt>
            <dd>{SOURCE_LABEL[place.source]}</dd>
          </div>
        )}
      </dl>

      <p className="notice">🐶 방문 전에 가게에 동반 가능 여부를 한 번 더 확인해 주세요.</p>

      <p className="directions-label">길찾기</p>
      <div className="sheet-actions directions">
        <button type="button" className="btn btn-map btn-kakao" onClick={() => openExternal(kakaoDirectionsUrl(place))}>
          카카오맵
        </button>
        <button type="button" className="btn btn-map btn-naver" onClick={() => openExternal(naverDirectionsUrl(place))}>
          네이버 지도
        </button>
      </div>
      {reportingEnabled && (
        <button type="button" className="btn btn-block btn-report" onClick={() => setReporting(true)}>
          정보가 달라요
        </button>
      )}
    </Sheet>
  );
}

const RESULT_MESSAGE: Record<SubmitResult, string> = {
  ok: '알려주셔서 고마워요! 확인 후 반영할게요.',
  duplicate: '오늘 이미 이 가게를 제보하셨어요.',
  error: '제보를 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
};

function ReportForm({
  place,
  onCancel,
  onDone,
}: {
  place: PlaceWithDistance;
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const [kind, setKind] = useState<ReportKind | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!kind) return;
    setSending(true);
    const result = await reportPlace(place, kind, note);
    setSending(false);
    onDone(RESULT_MESSAGE[result]);
  }

  return (
    <div className="form">
      <p className="muted">{place.name}</p>
      <div className="options" role="radiogroup">
        {(Object.keys(REPORT_KIND_LABEL) as ReportKind[]).map((k) => (
          <label key={k} className={`option${kind === k ? ' is-active' : ''}`}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
            {REPORT_KIND_LABEL[k]}
          </label>
        ))}
      </div>
      <textarea
        className="input"
        placeholder="자세히 알려주시면 더 빨리 고칠 수 있어요 (선택)"
        maxLength={300}
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="sheet-actions">
        <button type="button" className="btn btn-primary" disabled={!kind || sending} onClick={submit}>
          {sending ? '보내는 중…' : '제보하기'}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          취소
        </button>
      </div>
    </div>
  );
}
