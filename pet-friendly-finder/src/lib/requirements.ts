import type { Place } from '../types';

export interface Requirement {
  key: string;
  icon: string;
  label: string;
}

// 「반려동물 제한사항」 같은 자유 문구에서 방문 전에 챙길 것만 뽑아요.
// 위에서부터 중요한 순서예요(카드에는 앞의 몇 개만 보여줘요).
const RULES: (Requirement & { re: RegExp })[] = [
  { key: 'vaccine', icon: '💉', label: '예방접종', re: /접종/ },
  { key: 'leash', icon: '🦮', label: '목줄', re: /목줄|리드줄/ },
  { key: 'mannerBelt', icon: '🧷', label: '매너벨트', re: /매너\s*벨트|기저귀/ },
  { key: 'carrier', icon: '👜', label: '이동장', re: /케이지|이동장|이동가방|캐리어|가방/ },
  { key: 'hold', icon: '🤗', label: '안고 입장', re: /안고/ },
  { key: 'muzzle', icon: '😷', label: '입마개', re: /입마개/ },
  { key: 'noAggressive', icon: '⚠️', label: '공격성 있으면 제한', re: /공격성|입질/ },
  { key: 'noFierce', icon: '🚫', label: '맹견 불가', re: /맹견/ },
];

/** 장소의 필요사항 칩 목록 */
export function requirementsOf(place: Pick<Place, 'restriction'>): Requirement[] {
  const text = place.restriction ?? '';
  if (!text) return [];
  return RULES.filter((r) => r.re.test(text)).map(({ key, icon, label }) => ({ key, icon, label }));
}
