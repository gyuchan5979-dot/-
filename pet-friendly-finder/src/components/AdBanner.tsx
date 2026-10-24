import { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';

// 앱인토스 배너 광고 (목록 화면 전용)
// - 광고 그룹 ID는 .env.production 의 VITE_AD_BANNER_ID (콘솔 > 인앱 광고 > 광고 그룹)
//   개발 중에는 테스트 ID 'ait-ad-test-banner-id'를 써요. 출시 번들에는 실제 ID만 넣어요.
// - 토스 앱 5.241.0 미만이나 토스 앱 밖에서는 지원하지 않아서 아무것도 그리지 않아요.
// - 광고가 실제로 그려진 뒤에만 자리를 펼쳐서, 광고가 없을 때 빈 칸이 남지 않게 해요.

const AD_GROUP_ID = (import.meta.env.VITE_AD_BANNER_ID as string | undefined)?.trim() || '';

let initPromise: Promise<boolean> | null = null;

function isSupported(): boolean {
  try {
    return TossAds.initialize.isSupported() && TossAds.attachBanner.isSupported();
  } catch {
    return false;
  }
}

/** SDK 초기화는 앱 전체에서 한 번만 */
function initAds(): Promise<boolean> {
  initPromise ??= new Promise<boolean>((resolve) => {
    if (!AD_GROUP_ID || !isSupported()) {
      resolve(false);
      return;
    }
    const timer = setTimeout(() => resolve(false), 5000);
    try {
      TossAds.initialize({
        callbacks: {
          onInitialized: () => {
            clearTimeout(timer);
            resolve(true);
          },
          onInitializationFailed: () => {
            clearTimeout(timer);
            resolve(false);
          },
        },
      });
    } catch {
      clearTimeout(timer);
      resolve(false);
    }
  });
  return initPromise;
}

export const adsEnabled = AD_GROUP_ID !== '';

export function AdBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!adsEnabled) return;
    let banner: { destroy: () => void } | null = null;
    let cancelled = false;
    initAds().then((ok) => {
      if (!ok || cancelled || !ref.current) return;
      try {
        banner = TossAds.attachBanner(AD_GROUP_ID, ref.current, {
          theme: 'light',
          callbacks: {
            onAdRendered: () => !cancelled && setShown(true),
            onNoFill: () => !cancelled && setShown(false),
            onAdFailedToRender: () => !cancelled && setShown(false),
          },
        });
      } catch {
        // 광고가 안 붙어도 목록은 그대로 써요.
      }
    });
    return () => {
      cancelled = true;
      banner?.destroy();
    };
  }, []);

  if (!adsEnabled) return null;
  return (
    <li className={`ad-slot${shown ? ' is-shown' : ''}`} aria-label="광고">
      {/* 이 안은 비워 둬야 해요(SDK가 광고를 그려 넣어요) */}
      <div ref={ref} className="ad-banner" />
    </li>
  );
}
