import { useState } from 'react';
import { useBackHandler } from '../lib/back';
import { formatDistance } from '../lib/geo';
import { openExternal } from '../lib/location';
import { kakaoDirectionsUrl, naverDirectionsUrl } from '../lib/mapLinks';
import { REPORT_KIND_LABEL, reportPlace, reportingEnabled, type ReportKind, type SubmitResult } from '../lib/reports';
import type { PlaceWithDistance } from '../types';
import { PET_AREA_ICON, PET_AREA_LABEL, SOURCE_LABEL } from '../labels';
import { Sheet } from './Sheet';

interface Props {
  place: PlaceWithDistance;
  onClose: () => void;
  onToast: (message: string) => void;
}

export function PlaceDetail({ place, onClose, onToast }: Props) {
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

      {place.official && (
        <p className="official-note">
          ✓ 식약처 「반려동물 동반출입 음식점」으로 지자체에 등록된 곳이에요.
        </p>
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
