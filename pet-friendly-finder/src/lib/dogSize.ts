import { useCallback, useEffect, useState } from 'react';
import type { Place } from '../types';
import { readItem, writeItem } from './storage';

export type DogSize = 'small' | 'medium' | 'large';

export const DOG_SIZE_LABEL: Record<DogSize, string> = {
  small: '소형견',
  medium: '중형견',
  large: '대형견',
};

export const DOG_SIZE_HINT: Record<DogSize, string> = {
  small: '10kg 미만 (말티즈, 푸들, 포메라니안 등)',
  medium: '10~25kg (웰시코기, 시바, 비글 등)',
  large: '25kg 이상 (리트리버, 사모예드 등)',
};

const ORDER: DogSize[] = ['small', 'medium', 'large'];

/**
 * 가게가 받는 가장 큰 크기. 정보가 없으면 null(=가게에 문의).
 * 원본 문구 예: "모두 가능", "소형/중형", "소형", "15kg 이하", "10kg 미만"
 */
export function maxAllowedSize(place: Pick<Place, 'largeDogOk' | 'sizeNote'>): DogSize | null {
  if (place.largeDogOk) return 'large';
  const note = (place.sizeNote ?? '').replace(/\s/g, '');
  if (!note || /문의|해당없음/.test(note)) return null;
  if (/모두|모든|전체|제한없/.test(note)) return 'large';
  if (/중형/.test(note)) return 'medium';
  const kg = note.match(/(\d+(?:\.\d+)?)kg/i);
  if (kg) {
    const n = Number(kg[1]);
    if (n >= 25) return 'large';
    if (n >= 15) return 'medium';
    return 'small';
  }
  if (/소형/.test(note)) return 'small';
  return null;
}

/** 우리 강아지가 들어갈 수 있는지: yes / no / unknown(가게에 문의) */
export function fitsDog(place: Pick<Place, 'largeDogOk' | 'sizeNote'>, size: DogSize): 'yes' | 'no' | 'unknown' {
  const max = maxAllowedSize(place);
  if (max === null) return 'unknown';
  return ORDER.indexOf(size) <= ORDER.indexOf(max) ? 'yes' : 'no';
}

const KEY = 'dogSize.v1';

export function useDogSize() {
  const [size, setSize] = useState<DogSize | null>(null);
  useEffect(() => {
    readItem(KEY).then((v) => {
      if (v === 'small' || v === 'medium' || v === 'large') setSize(v);
    });
  }, []);
  const update = useCallback((next: DogSize | null) => {
    setSize(next);
    void writeItem(KEY, next ?? '');
  }, []);
  return [size, update] as const;
}
