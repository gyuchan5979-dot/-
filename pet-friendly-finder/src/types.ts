export type Category = 'restaurant' | 'cafe';

/** 반려견을 데리고 들어갈 수 있는 범위 */
export type PetArea = 'indoor' | 'terrace' | 'partial' | 'carrier' | 'unknown';

export interface Place {
  id: string;
  name: string;
  category: Category;
  address: string;
  lat: number;
  lng: number;
  petArea: PetArea;
  largeDogOk: boolean;
  /** 물그릇, 펫메뉴 등 반려견 편의 */
  amenities: string[];
  phone?: string;
  /** 원본 데이터의 「입장 가능 동물 크기」 문구 */
  sizeNote?: string;
  /** 원본 데이터의 「반려동물 제한사항」 문구 */
  restriction?: string;
  /** 동반 가능 여부를 마지막으로 확인한 날짜 (YYYY-MM-DD) */
  verifiedAt?: string;
  /** 데이터 출처: kcisa(한국문화정보원), tourapi(한국관광공사), user(사용자 제보) */
  source?: string;
}

export interface Coords {
  lat: number;
  lng: number;
}

export interface PlaceWithDistance extends Place {
  distanceM: number;
}
