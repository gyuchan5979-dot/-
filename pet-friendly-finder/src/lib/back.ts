import { useEffect, useRef } from 'react';
import { graniteEvent } from '@apps-in-toss/web-framework';

// 뒤로가기 처리
//
// 바텀시트·지역 선택처럼 "열려 있는 것"이 있으면 뒤로가기로 그것부터 닫고,
// 아무것도 없을 때만 원래 동작(미니앱 종료)을 하게 해요.
// - 토스 앱: graniteEvent의 backEvent를 구독하면 기본 뒤로가기가 막히고 onEvent가 불려요.
//   그래서 닫을 게 있을 때만 구독하고, 없으면 구독을 풀어 기본 동작(종료)이 되게 해요.
// - 일반 브라우저(개발용): history에 항목을 하나 두고 popstate로 닫아요.

type Handler = () => void;

/** 열린 순서대로 쌓인 닫기 함수들. 뒤로가기는 가장 마지막 것부터 닫아요. */
const stack: Handler[] = [];
let unsubscribeToss: (() => void) | null = null;

function isTossWebView(): boolean {
  return typeof window !== 'undefined' && (window as { ReactNativeWebView?: unknown }).ReactNativeWebView != null;
}

function closeTop() {
  stack[stack.length - 1]?.();
}

function syncToss() {
  if (stack.length > 0 && !unsubscribeToss) {
    try {
      unsubscribeToss = graniteEvent.addEventListener('backEvent', { onEvent: closeTop, onError: () => {} });
    } catch {
      // 오래된 토스 앱 등 구독할 수 없으면 기본 뒤로가기를 그대로 둬요.
    }
  } else if (stack.length === 0 && unsubscribeToss) {
    unsubscribeToss();
    unsubscribeToss = null;
  }
}

/**
 * 브라우저: 닫을 게 있는 동안 history에 항목을 딱 하나(sentinel) 둬요.
 * 화면이 다 바뀐 뒤(setTimeout) 상태를 맞춰서, 열고 닫기가 한 번에 일어나도 순서가 꼬이지 않게 해요.
 */
let sentinel = false;
let ignoreNextPop = 0;
let syncScheduled = false;

function scheduleBrowserSync() {
  if (syncScheduled) return;
  syncScheduled = true;
  setTimeout(() => {
    syncScheduled = false;
    if (stack.length > 0 && !sentinel) {
      window.history.pushState({ back: true }, '');
      sentinel = true;
    } else if (stack.length === 0 && sentinel) {
      // 버튼으로 다 닫힌 경우: 남은 항목을 되돌려요. (이때 생기는 popstate는 무시)
      sentinel = false;
      ignoreNextPop++;
      window.history.back();
    }
  }, 0);
}

if (typeof window !== 'undefined' && !isTossWebView()) {
  window.addEventListener('popstate', () => {
    if (ignoreNextPop > 0) {
      ignoreNextPop--;
      return;
    }
    if (!sentinel) return;
    // 뒤로가기로 sentinel을 벗어났어요. 하나 닫고, 아직 남은 게 있으면 다시 sentinel을 둬요.
    sentinel = false;
    closeTop();
    scheduleBrowserSync();
  });
}

function push(handler: Handler) {
  stack.push(handler);
  if (isTossWebView()) syncToss();
  else scheduleBrowserSync();
}

function remove(handler: Handler) {
  const i = stack.lastIndexOf(handler);
  if (i < 0) return;
  stack.splice(i, 1);
  if (isTossWebView()) syncToss();
  else scheduleBrowserSync();
}

/**
 * active인 동안 뒤로가기를 누르면 onBack이 불려요.
 * onBack 안에서 active를 false로 바꾸면(예: 시트 닫기) 등록이 풀려요.
 */
export function useBackHandler(active: boolean, onBack: () => void) {
  const ref = useRef(onBack);
  useEffect(() => {
    ref.current = onBack;
  });

  useEffect(() => {
    if (!active) return;
    return registerBackHandler(() => ref.current());
  }, [active]);
}

/** 뒤로가기 핸들러를 등록하고, 해제 함수를 돌려줘요. */
export function registerBackHandler(handler: Handler): () => void {
  push(handler);
  return () => remove(handler);
}
