import type { Place } from '../types';

/**
 * 화면 개발용 가상 데이터예요. 실제 가게가 아니에요.
 * 출시 전에 공공데이터(문화빅데이터플랫폼 반려동물 동반 가능 시설, TourAPI 등)와
 * 사용자 제보 데이터로 교체해야 해요.
 */
export const SAMPLE_PLACES: Place[] = [
  // 서울시청 주변
  { id: 's1', name: '멍멍브런치', category: 'restaurant', address: '서울 중구 (샘플 주소)', lat: 37.5679, lng: 126.9801, petArea: 'indoor', largeDogOk: true, amenities: ['물그릇', '펫메뉴'], verifiedAt: '2026-09-28' },
  { id: 's2', name: '꼬리살랑 커피', category: 'cafe', address: '서울 중구 (샘플 주소)', lat: 37.5651, lng: 126.9752, petArea: 'indoor', largeDogOk: false, amenities: ['물그릇', '펫쿠키'], verifiedAt: '2026-10-02' },
  { id: 's3', name: '테라스 파스타집', category: 'restaurant', address: '서울 종로구 (샘플 주소)', lat: 37.5712, lng: 126.9768, petArea: 'terrace', largeDogOk: true, amenities: ['물그릇'], verifiedAt: '2026-08-15' },
  { id: 's4', name: '도그라운지 카페', category: 'cafe', address: '서울 중구 (샘플 주소)', lat: 37.5618, lng: 126.9842, petArea: 'indoor', largeDogOk: true, amenities: ['물그릇', '펫메뉴', '놀이공간'], verifiedAt: '2026-10-05' },
  { id: 's5', name: '켄넬 베이커리', category: 'cafe', address: '서울 종로구 (샘플 주소)', lat: 37.5738, lng: 126.9851, petArea: 'carrier', largeDogOk: false, amenities: [], verifiedAt: '2026-07-20' },
  { id: 's6', name: '산책길 국밥', category: 'restaurant', address: '서울 서대문구 (샘플 주소)', lat: 37.5689, lng: 126.9662, petArea: 'terrace', largeDogOk: false, amenities: ['물그릇'] },
  { id: 's7', name: '퍼피 버거하우스', category: 'restaurant', address: '서울 중구 (샘플 주소)', lat: 37.5596, lng: 126.9711, petArea: 'indoor', largeDogOk: false, amenities: ['펫메뉴'], verifiedAt: '2026-09-10' },
  { id: 's8', name: '한강뷰 펫카페', category: 'cafe', address: '서울 용산구 (샘플 주소)', lat: 37.5445, lng: 126.9670, petArea: 'indoor', largeDogOk: true, amenities: ['물그릇', '놀이공간', '포토존'], verifiedAt: '2026-09-30' },

  // 남양주 진접 주변
  { id: 'j1', name: '진접 댕댕마당', category: 'cafe', address: '경기 남양주시 진접읍 (샘플 주소)', lat: 37.7215, lng: 127.1902, petArea: 'indoor', largeDogOk: true, amenities: ['물그릇', '운동장'], verifiedAt: '2026-10-01' },
  { id: 'j2', name: '숲속 바베큐', category: 'restaurant', address: '경기 남양주시 진접읍 (샘플 주소)', lat: 37.7302, lng: 127.2011, petArea: 'terrace', largeDogOk: true, amenities: ['물그릇'], verifiedAt: '2026-09-18' },
  { id: 'j3', name: '오남 호수 카페', category: 'cafe', address: '경기 남양주시 오남읍 (샘플 주소)', lat: 37.6981, lng: 127.2085, petArea: 'terrace', largeDogOk: false, amenities: ['물그릇', '펫쿠키'] },
  { id: 'j4', name: '별내 펫프렌들리 식당', category: 'restaurant', address: '경기 남양주시 별내동 (샘플 주소)', lat: 37.6441, lng: 127.1150, petArea: 'indoor', largeDogOk: false, amenities: ['펫메뉴'], verifiedAt: '2026-08-30' },
];
