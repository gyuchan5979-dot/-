import { describe, expect, it } from 'vitest';
import { parseSharedPlace, shareMessage, sharePath } from './share';

describe('공유 링크', () => {
  const place = { id: 'fsk-abc', lat: 37.5446, lng: 127.0557, name: '멍카페', address: '서울 성동구' };

  it('intoss:// 경로에 가게 id와 좌표를 담는다', () => {
    const path = sharePath(place);
    expect(path.startsWith('intoss://pet-friendly-finder?')).toBe(true);
    expect(parseSharedPlace(path.split('?')[1])).toEqual({ id: 'fsk-abc', coords: { lat: 37.5446, lng: 127.0557 } });
  });

  it('이상한 값은 무시', () => {
    expect(parseSharedPlace('')).toBeNull();
    expect(parseSharedPlace('?place=x&lat=0&lng=0')).toBeNull();
    expect(parseSharedPlace('?lat=37.5&lng=127')).toBeNull();
  });

  it('메시지에 가게 이름·주소·링크', () => {
    expect(shareMessage(place, 'https://toss.im/x')).toContain('멍카페\n서울 성동구\n\nhttps://toss.im/x');
  });
});
