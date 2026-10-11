import type { ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** 아래에서 올라오는 시트. 바깥을 누르면 닫혀요. */
export function Sheet({ title, onClose, children }: Props) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <h2 id="sheet-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}
