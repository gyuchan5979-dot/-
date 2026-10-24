import { Share } from '@apps-in-toss/web-framework';
import type { Line } from '../data/lines';
import { isDateKey } from './daily';
import { isTossWebView } from './storage';

// 문장 공유: 토스 공유 링크(intoss://)로 보내요. 받은 사람이 열면 그날의 문장이 보여요.

export const APP_NAME = 'daily-line';

/** intoss://daily-line?d=2026-10-24 */
export function sharePath(day: string): string {
  return `intoss://${APP_NAME}?d=${day}`;
}

/** 공유 링크로 들어왔으면 그 날짜 (주소의 쿼리에서 읽어요) */
export function parseSharedDay(search: string): string | null {
  const d = new URLSearchParams(search).get('d');
  return isDateKey(d) ? d : null;
}

export function shareMessage(line: Line, link: string): string {
  return `📖 오늘의 한 줄\n\n${line.text}\n— ${line.author}, 「${line.work}」\n\n${link}`;
}

export async function shareLine(line: Line, day: string): Promise<'shared' | 'copied' | 'failed'> {
  if (isTossWebView()) {
    try {
      const link = await Share.createLink({ path: sharePath(day) });
      await Share.sendMessage({ message: shareMessage(line, link) });
      return 'shared';
    } catch {
      return 'failed';
    }
  }
  // 브라우저(개발용): 같은 쿼리를 붙인 현재 주소를 써요.
  const link = `${window.location.origin}${window.location.pathname}?d=${day}`;
  try {
    if (navigator.share) {
      await navigator.share({ text: shareMessage(line, link) });
      return 'shared';
    }
    await navigator.clipboard.writeText(shareMessage(line, link));
    return 'copied';
  } catch {
    return 'failed';
  }
}
