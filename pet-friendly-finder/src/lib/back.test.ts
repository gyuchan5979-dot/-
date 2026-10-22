import { beforeEach, describe, expect, it, vi } from 'vitest';

// 토스 웹뷰 환경을 흉내 내요: backEvent 구독 여부와 이벤트 발생을 직접 제어해요.
const toss = vi.hoisted(() => ({ onEvent: null as null | (() => void), subscribeCount: 0, unsubscribeCount: 0 }));
vi.mock('@apps-in-toss/web-framework', () => ({
  graniteEvent: {
    addEventListener: (_event: string, args: { onEvent: () => void }) => {
      toss.subscribeCount++;
      toss.onEvent = args.onEvent;
      return () => {
        toss.unsubscribeCount++;
        toss.onEvent = null;
      };
    },
  },
}));

beforeEach(() => {
  vi.stubGlobal('window', { ReactNativeWebView: {}, addEventListener: () => {}, history: {} });
});

describe('토스 앱 뒤로가기', () => {
  it('닫을 게 있을 때만 backEvent를 구독하고, 가장 나중에 연 것부터 닫는다', async () => {
    const { registerBackHandler } = await import('./back');
    const closed: string[] = [];

    // 아무것도 안 열려 있으면 구독하지 않음 → 기본 동작(미니앱 종료)
    expect(toss.onEvent).toBeNull();

    const offDetail = registerBackHandler(() => closed.push('detail'));
    const offReport = registerBackHandler(() => closed.push('report'));
    expect(toss.subscribeCount).toBe(1);

    toss.onEvent!();
    expect(closed).toEqual(['report']);
    offReport();

    toss.onEvent!();
    expect(closed).toEqual(['report', 'detail']);
    offDetail();

    // 모두 닫히면 구독 해제 → 다시 뒤로가기하면 미니앱 종료
    expect(toss.unsubscribeCount).toBe(1);
    expect(toss.onEvent).toBeNull();
  });
});
