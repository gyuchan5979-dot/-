export type Category = 'restaurant' | 'cafe';

/** 반려견을 데리고 들어갈 수 있는 범위 */
export type PetArea = 'indoor' | 'terrace' | 'carrier';

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
  /** 동반 가능 여부를 마지막으로 확인한 날짜 (YYYY-MM-DD) */
  verifiedAt?: string;
}

export interface Coords {
  lat: number;
  lng: number;
}

export interface PlaceWithDistance extends Place {
  distanceM: number;
}
