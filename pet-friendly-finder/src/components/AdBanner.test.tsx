// @vitest-environment happy-dom
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 토스 광고 SDK 흉내: 지원 여부, 초기화 결과, 광고 콜백을 테스트에서 직접 조종해요.
const sdk = vi.hoisted(() => ({
  supported: true,
  initOk: true,
  callbacks: null as null | Record<string, () => void>,
  attachedTo: null as null | HTMLElement,
  destroyed: 0,
}));
vi.mock('@apps-in-toss/web-framework', () => ({
  TossAds: {
    initialize: Object.assign(
      (o: { callbacks: { onInitialized: () => void; onInitializationFailed: (e: Error) => void } }) =>
        sdk.initOk ? o.callbacks.onInitialized() : o.callbacks.onInitializationFailed(new Error('x')),
      { isSupported: () => sdk.supported },
    ),
    attachBanner: Object.assign(
      (_id: string, el: HTMLElement, o: { callbacks: Record<string, () => void> }) => {
        sdk.attachedTo = el;
        sdk.callbacks = o.callbacks;
        return { destroy: () => sdk.destroyed++ };
      },
      { isSupported: () => sdk.supported },
    ),
  },
}));

async function mount() {
  vi.resetModules();
  const { AdBanner } = await import('./AdBanner');
  let utils!: ReturnType<typeof render>;
  await act(async () => {
    utils = render(
      <ul>
        <AdBanner />
      </ul>,
    );
  });
  return utils;
}

beforeEach(() => {
  vi.stubEnv('VITE_AD_BANNER_ID', 'ait-ad-test-banner-id');
  Object.assign(sdk, { supported: true, initOk: true, callbacks: null, attachedTo: null, destroyed: 0 });
});
afterEach(() => vi.unstubAllEnvs());

describe('배너 광고', () => {
  it('광고가 그려지면 자리를 펼치고, 화면을 떠나면 정리해요', async () => {
    const { container, unmount } = await mount();
    const slot = container.querySelector('.ad-slot')!;
    expect(sdk.attachedTo).toBe(container.querySelector('.ad-banner'));
    expect(slot.classList.contains('is-shown')).toBe(false);
    await act(async () => sdk.callbacks!.onAdRendered());
    expect(slot.classList.contains('is-shown')).toBe(true);
    unmount();
    expect(sdk.destroyed).toBe(1);
  });

  it('광고가 없으면(no fill) 빈 칸을 남기지 않아요', async () => {
    const { container } = await mount();
    await act(async () => sdk.callbacks!.onAdRendered());
    await act(async () => sdk.callbacks!.onNoFill());
    expect(container.querySelector('.ad-slot')!.classList.contains('is-shown')).toBe(false);
  });

  it('지원하지 않는 토스 버전이면 광고를 붙이지 않아요', async () => {
    sdk.supported = false;
    const { container } = await mount();
    expect(sdk.attachedTo).toBeNull();
    expect(container.querySelector('.ad-slot')!.classList.contains('is-shown')).toBe(false);
  });

  it('초기화에 실패해도 광고를 붙이지 않아요', async () => {
    sdk.initOk = false;
    await mount();
    expect(sdk.attachedTo).toBeNull();
  });

  it('광고 ID가 없으면 아무것도 그리지 않아요', async () => {
    vi.stubEnv('VITE_AD_BANNER_ID', '');
    const { container } = await mount();
    expect(container.querySelector('.ad-slot')).toBeNull();
  });
});
