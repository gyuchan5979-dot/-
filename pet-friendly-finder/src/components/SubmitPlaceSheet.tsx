import { useState } from 'react';
import { submitPlace, type SubmitResult } from '../lib/reports';
import { PET_AREA_LABEL } from '../labels';
import type { Category, Coords, PetArea } from '../types';
import { Sheet } from './Sheet';

interface Props {
  coords: Coords;
  /** 현재 위치가 진짜 GPS 위치인지 (기본 위치면 제보를 막아요) */
  hasRealLocation: boolean;
  onClose: () => void;
  onToast: (message: string) => void;
}

const RESULT_MESSAGE: Record<SubmitResult, string> = {
  ok: '제보 고마워요! 확인 후 지도에 올릴게요.',
  duplicate: '오늘 이미 같은 이름으로 제보하셨어요.',
  error: '제보를 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
};

const AREA_OPTIONS: PetArea[] = ['indoor', 'terrace', 'partial', 'carrier'];

/** 지금 있는 가게를 새로 제보해요. 위치는 현재 GPS 위치를 써요. */
export function SubmitPlaceSheet({ coords, hasRealLocation, onClose, onToast }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('cafe');
  const [address, setAddress] = useState('');
  const [petArea, setPetArea] = useState<PetArea>('indoor');
  const [largeDogOk, setLargeDogOk] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const canSubmit = hasRealLocation && name.trim().length > 0 && !sending;

  async function submit() {
    if (!canSubmit) return;
    setSending(true);
    const result = await submitPlace({ name, category, address, coords, petArea, largeDogOk, note });
    setSending(false);
    onToast(RESULT_MESSAGE[result]);
    if (result !== 'error') onClose();
  }

  return (
    <Sheet title="애견동반 장소 제보" onClose={onClose}>
      <div className="form">
        {hasRealLocation ? (
          <p className="muted">가게 안이나 바로 앞에서 제보해 주세요. 지금 위치로 등록돼요.</p>
        ) : (
          <p className="notice">위치를 확인할 수 없어 제보할 수 없어요. 위치 권한을 켜고 새로고침해 주세요.</p>
        )}

        <label className="field">
          <span>가게 이름</span>
          <input className="input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 멍멍커피 성수점" />
        </label>

        <div className="field">
          <span>종류</span>
          <div className="chips chips-inline">
            {(['cafe', 'restaurant'] as Category[]).map((c) => (
              <button key={c} type="button" className={`chip${category === c ? ' is-active' : ''}`} aria-pressed={category === c} onClick={() => setCategory(c)}>
                {c === 'cafe' ? '☕ 카페' : '🍽 식당'}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>동반 범위</span>
          <div className="chips chips-inline">
            {AREA_OPTIONS.map((a) => (
              <button key={a} type="button" className={`chip${petArea === a ? ' is-active' : ''}`} aria-pressed={petArea === a} onClick={() => setPetArea(a)}>
                {PET_AREA_LABEL[a]}
              </button>
            ))}
          </div>
        </div>

        <label className="check">
          <input type="checkbox" checked={largeDogOk} onChange={(e) => setLargeDogOk(e.target.checked)} />
          대형견도 들어갈 수 있어요
        </label>

        <label className="field">
          <span>주소 (선택)</span>
          <input className="input" maxLength={120} value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>

        <label className="field">
          <span>메모 (선택)</span>
          <textarea className="input" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="물그릇 있음, 매너벨트 필수 등" />
        </label>

        <div className="sheet-actions">
          <button type="button" className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
            {sending ? '보내는 중…' : '제보하기'}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </Sheet>
  );
}
