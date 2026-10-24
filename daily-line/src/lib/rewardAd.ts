import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';

// 보상형 광고: "광고 보고 지난 문장 열기"
// - 광고 그룹 ID는 .env.production 의 VITE_AD_REWARD_ID (콘솔 > 인앱 광고 > 광고 그룹, 보상형)
// - ID가 없거나 토스 앱이 광고를 지원하지 않으면 광고 없이 바로 열어 줘요.
//   (광고가 안 된다고 문장을 못 보게 막지 않아요)

const AD_GROUP_ID = (import.meta.env.VITE_AD_REWARD_ID as string | undefined)?.trim() || '';

export type RewardResult = 'rewarded' | 'skipped' | 'free';

function supported(): boolean {
  try {
    return loadFullScreenAd.isSupported() && showFullScreenAd.isSupported();
  } catch {
    return false;
  }
}

export const rewardAdsEnabled = () => AD_GROUP_ID !== '' && supported();

/**
 * 광고를 불러와 보여주고, 끝까지 봤는지 알려줘요.
 * - rewarded: 끝까지 봄 → 열어 주기
 * - skipped: 중간에 닫음 → 열지 않기
 * - free: 광고를 쓸 수 없음(미지원·불러오기 실패) → 그냥 열어 주기
 */
export function showRewardAd(): Promise<RewardResult> {
  if (!rewardAdsEnabled()) return Promise.resolve('free');
  return new Promise((resolve) => {
    let done = false;
    const finish = (r: RewardResult) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(r);
    };
    // 광고가 오래 안 뜨면 기다리게 하지 않고 열어 줘요.
    const timer = setTimeout(() => finish('free'), 8000);
    const options = { adGroupId: AD_GROUP_ID };
    try {
      loadFullScreenAd({
        options,
        onEvent: (e) => {
          if (e.type !== 'loaded') return;
          clearTimeout(timer);
          let earned = false;
          try {
            showFullScreenAd({
              options,
              onEvent: (ev) => {
                if (ev.type === 'userEarnedReward') earned = true;
                if (ev.type === 'dismissed') finish(earned ? 'rewarded' : 'skipped');
                if (ev.type === 'failedToShow') finish('free');
              },
              onError: () => finish('free'),
            });
          } catch {
            finish('free');
          }
        },
        onError: () => finish('free'),
      });
    } catch {
      finish('free');
    }
  });
}
