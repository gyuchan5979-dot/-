import { Storage } from '@apps-in-toss/web-framework';

// 기기에만 저장하는 작은 값들(찜, 우리 강아지 크기).
// 토스 앱에서는 앱인토스 Storage, 브라우저(개발용)에서는 localStorage를 써요.

export function isTossWebView(): boolean {
  return typeof window !== 'undefined' && (window as { ReactNativeWebView?: unknown }).ReactNativeWebView != null;
}

export async function readItem(key: string): Promise<string | null> {
  try {
    return isTossWebView() ? await Storage.getItem(key) : localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function writeItem(key: string, value: string): Promise<void> {
  try {
    if (isTossWebView()) await Storage.setItem(key, value);
    else localStorage.setItem(key, value);
  } catch {
    // 저장에 실패해도 이번 실행 동안은 화면에 반영돼 있어요.
  }
}
