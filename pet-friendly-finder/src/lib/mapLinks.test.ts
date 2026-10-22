import { describe, expect, it } from 'vitest';
import { kakaoDirectionsUrl, naverDirectionsUrl } from './mapLinks';

const place = { name: '사직커피 & 베이크', lat: 37.5757, lng: 126.9688 };

describe('길찾기 링크', () => {
  it('카카오맵: 이름,위도,경도', () => {
    expect(kakaoDirectionsUrl(place)).toBe(
      'https://map.kakao.com/link/to/%EC%82%AC%EC%A7%81%EC%BB%A4%ED%94%BC%20%26%20%EB%B2%A0%EC%9D%B4%ED%81%AC,37.5757,126.9688',
    );
  });

  it('네이버 지도: 도착지 좌표·이름이 들어간다', () => {
    const url = new URL(naverDirectionsUrl(place));
    expect(url.origin).toBe('https://map.naver.com');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      elng: '126.9688',
      elat: '37.5757',
      etext: '사직커피 & 베이크',
      menu: 'route',
      pathType: '0',
    });
  });
});
