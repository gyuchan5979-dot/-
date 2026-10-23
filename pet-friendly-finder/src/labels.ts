import type { PetArea } from './types';

export const PET_AREA_LABEL: Record<PetArea, string> = {
  indoor: '실내 동반 가능',
  terrace: '테라스·야외석만',
  partial: '일부 구역만 동반',
  carrier: '케이지·이동가방 필수',
  unknown: '동반 범위 확인 필요',
};

export const PET_AREA_ICON: Record<PetArea, string> = {
  indoor: '🏠',
  terrace: '🌳',
  partial: '🪑',
  carrier: '👜',
  unknown: '❔',
};

export const SOURCE_LABEL: Record<string, string> = {
  fsk: '식약처 등록 업소 현황',
  kcisa: '한국문화정보원',
  tourapi: '한국관광공사',
  user: '사용자 제보',
};
