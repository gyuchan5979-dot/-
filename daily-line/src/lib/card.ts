import { File as TossFile } from '@apps-in-toss/web-framework';
import type { Line } from '../data/lines';
import { formatDate } from './daily';
import { isTossWebView } from './storage';

// 문장 카드 이미지 (인스타 스토리·피드에 올리기 좋은 4:5 크기)

const W = 1080;
const H = 1350;
const SERIF = '"Nanum Myeongjo", "AppleMyungjo", "Noto Serif KR", serif';

/** 한 줄이 maxWidth를 넘으면 글자 단위로 줄을 나눠요. (한글은 단어 길이가 짧아 어절 단위로 먼저 시도) */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    if (para === '') {
      out.push('');
      continue;
    }
    let cur = '';
    for (const word of para.split(' ')) {
      const next = cur ? `${cur} ${word}` : word;
      if (measure(next) <= maxWidth) {
        cur = next;
        continue;
      }
      if (cur) out.push(cur);
      cur = '';
      // 어절 하나가 너무 길면 글자 단위로 잘라요
      for (const ch of word) {
        if (measure(cur + ch) > maxWidth && cur) {
          out.push(cur);
          cur = '';
        }
        cur += ch;
      }
    }
    out.push(cur);
  }
  return out;
}

export async function drawCard(line: Line, day: string): Promise<HTMLCanvasElement> {
  try {
    await Promise.all([document.fonts.load(`700 52px "Nanum Myeongjo"`), document.fonts.load(`400 32px "Nanum Myeongjo"`)]);
  } catch {
    // 글꼴을 못 받아도 기본 명조체로 그려요.
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FBF6EC';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#E6DCC8';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#9A8B73';
  ctx.font = `400 34px ${SERIF}`;
  ctx.fillText(`매일 한 줄 · ${formatDate(day)}`, W / 2, 170);

  // 본문: 길이에 따라 글자 크기를 줄여요
  let size = 60;
  let lines: string[] = [];
  for (; size >= 38; size -= 4) {
    ctx.font = `700 ${size}px ${SERIF}`;
    lines = wrapText(line.text, W - 220, (s) => ctx.measureText(s).width);
    if (lines.length * size * 1.7 <= 760) break;
  }
  const lh = size * 1.7;
  const top = H / 2 - (lines.length * lh) / 2 - 40;
  ctx.fillStyle = '#2B2620';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lh + size));

  ctx.fillStyle = '#6B5E4B';
  ctx.font = `400 36px ${SERIF}`;
  const by = top + lines.length * lh + 90;
  ctx.fillText(`— ${line.author}, 「${line.work}」`, W / 2, by);
  if (line.translated) {
    ctx.font = `400 26px ${SERIF}`;
    ctx.fillStyle = '#A99A82';
    ctx.fillText('매일 한 줄 옮김', W / 2, by + 50);
  }

  ctx.fillStyle = '#B8AA92';
  ctx.font = `400 28px ${SERIF}`;
  ctx.fillText('토스에서 「매일 한 줄」', W / 2, H - 110);
  return canvas;
}

/** 카드를 사진첩(기기)에 저장해요. */
export async function saveCard(line: Line, day: string): Promise<'saved' | 'failed'> {
  try {
    const canvas = await drawCard(line, day);
    const dataUrl = canvas.toDataURL('image/png');
    const fileName = `매일한줄-${day}.png`;
    if (isTossWebView()) {
      if (!TossFile.saveBase64.isSupported()) return 'failed';
      await TossFile.saveBase64({ data: dataUrl.split(',')[1], fileName, mimeType: 'image/png' });
      return 'saved';
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return 'saved';
  } catch {
    return 'failed';
  }
}
