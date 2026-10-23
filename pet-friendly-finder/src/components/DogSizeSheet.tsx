import { DOG_SIZE_HINT, DOG_SIZE_LABEL, type DogSize } from '../lib/dogSize';
import { Sheet } from './Sheet';

interface Props {
  value: DogSize | null;
  onChange: (size: DogSize | null) => void;
  onClose: () => void;
}

const SIZES: { size: DogSize; icon: string }[] = [
  { size: 'small', icon: '🐩' },
  { size: 'medium', icon: '🐕' },
  { size: 'large', icon: '🦮' },
];

/** 우리 강아지 크기 고르기. 고르면 들어갈 수 없는 곳은 목록에서 빠져요. */
export function DogSizeSheet({ value, onChange, onClose }: Props) {
  const choose = (size: DogSize | null) => {
    onChange(size);
    onClose();
  };
  return (
    <Sheet title="우리 아이는 어떤 크기인가요?" onClose={onClose}>
      <p className="muted">고르면 우리 아이가 들어갈 수 없는 곳은 빼고 보여드려요. 이 기기에만 저장돼요.</p>
      <div className="options size-options">
        {SIZES.map(({ size, icon }) => (
          <button
            key={size}
            type="button"
            className={`option${value === size ? ' is-active' : ''}`}
            aria-pressed={value === size}
            onClick={() => choose(size)}
          >
            <span className="size-icon" aria-hidden="true">
              {icon}
            </span>
            <span>
              <strong>{DOG_SIZE_LABEL[size]}</strong>
              <br />
              <span className="muted">{DOG_SIZE_HINT[size]}</span>
            </span>
          </button>
        ))}
        <button type="button" className={`option${value === null ? ' is-active' : ''}`} onClick={() => choose(null)}>
          <span className="size-icon" aria-hidden="true">
            🐾
          </span>
          <span>
            <strong>설정 안 함</strong>
            <br />
            <span className="muted">크기와 상관없이 모두 보기</span>
          </span>
        </button>
      </div>
    </Sheet>
  );
}
