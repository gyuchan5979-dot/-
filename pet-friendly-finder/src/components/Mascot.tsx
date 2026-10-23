/** 앱 마스코트 강아지 (직접 그린 SVG라 기기마다 모양이 같아요) */
export type MascotMood = 'happy' | 'sniff' | 'sad';

interface Props {
  size?: number;
  mood?: MascotMood;
  className?: string;
}

export function Mascot({ size = 56, mood = 'happy', className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`mascot mascot-${mood}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="강아지 캐릭터"
    >
      {/* 귀 */}
      <g className="mascot-ears">
        <path d="M22 34 C8 40 6 70 18 80 C26 86 34 74 34 62 C34 50 32 38 22 34Z" fill="#B97A4B" />
        <path d="M98 34 C112 40 114 70 102 80 C94 86 86 74 86 62 C86 50 88 38 98 34Z" fill="#B97A4B" />
      </g>
      {/* 얼굴 */}
      <ellipse cx="60" cy="64" rx="38" ry="36" fill="#F6D9AE" />
      {/* 이마 무늬 */}
      <path d="M60 28 C52 28 48 36 50 44 C54 40 66 40 70 44 C72 36 68 28 60 28Z" fill="#E9BD86" />
      {/* 볼터치 */}
      <ellipse cx="36" cy="76" rx="7" ry="4.5" fill="#FFB4A8" opacity="0.8" />
      <ellipse cx="84" cy="76" rx="7" ry="4.5" fill="#FFB4A8" opacity="0.8" />
      {/* 눈 */}
      {mood === 'sad' ? (
        <g stroke="#2B2B2B" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M40 60 Q46 64 52 60" />
          <path d="M68 60 Q74 64 80 60" />
        </g>
      ) : (
        <g>
          <circle cx="46" cy="60" r="6.5" fill="#2B2B2B" />
          <circle cx="74" cy="60" r="6.5" fill="#2B2B2B" />
          <circle cx="48.5" cy="57.5" r="2.2" fill="#fff" />
          <circle cx="76.5" cy="57.5" r="2.2" fill="#fff" />
        </g>
      )}
      {/* 주둥이 */}
      <ellipse cx="60" cy="80" rx="15" ry="11" fill="#FFF3E2" />
      {/* 코 */}
      <ellipse className="mascot-nose" cx="60" cy="74" rx="6" ry="4.5" fill="#3A2A22" />
      {/* 입 */}
      {mood === 'sad' ? (
        <path d="M53 88 Q60 83 67 88" stroke="#3A2A22" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : (
        <g>
          <path d="M60 78 V82 M60 82 Q55 87 51 84 M60 82 Q65 87 69 84" stroke="#3A2A22" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {mood === 'happy' && <path d="M56 85 Q60 95 64 85 Z" fill="#FF7E8A" />}
        </g>
      )}
    </svg>
  );
}
