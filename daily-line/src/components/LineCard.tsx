import type { Line } from '../data/lines';
import { formatDate } from '../lib/daily';

interface Props {
  line: Line;
  day: string;
  /** 날짜 위에 붙는 작은 이름표 (예: "오늘의 한 줄") */
  label: string;
}

export function LineCard({ line, day, label }: Props) {
  return (
    <article className="line-card">
      <p className="line-date">
        {label} · {formatDate(day)}
      </p>
      <blockquote className="line-text">{line.text}</blockquote>
      <p className="line-by">
        — {line.author}, 「{line.work}」
      </p>
      {line.translated && <p className="line-note">원문에서 매일 한 줄이 새로 옮겼어요</p>}
    </article>
  );
}

export function Thought({ line }: { line: Line }) {
  return (
    <p className="thought">
      <span aria-hidden>💭</span> {line.thought}
    </p>
  );
}
