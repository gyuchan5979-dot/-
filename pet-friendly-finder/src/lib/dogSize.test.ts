import { describe, expect, it } from 'vitest';
import { fitsDog, maxAllowedSize } from './dogSize';

const p = (sizeNote?: string, largeDogOk = false) => ({ sizeNote, largeDogOk });

describe('우리 강아지 크기', () => {
  it('원본 크기 문구 해석', () => {
    expect(maxAllowedSize(p('모두 가능', true))).toBe('large');
    expect(maxAllowedSize(p('소형/중형'))).toBe('medium');
    expect(maxAllowedSize(p('15kg 이하'))).toBe('medium');
    expect(maxAllowedSize(p('10kg 미만'))).toBe('small');
    expect(maxAllowedSize(p('소형'))).toBe('small');
    expect(maxAllowedSize(p('가게에 문의'))).toBeNull();
    expect(maxAllowedSize(p(undefined))).toBeNull();
  });

  it('들어갈 수 있는지', () => {
    expect(fitsDog(p('소형/중형'), 'medium')).toBe('yes');
    expect(fitsDog(p('소형/중형'), 'large')).toBe('no');
    expect(fitsDog(p('10kg 미만'), 'small')).toBe('yes');
    expect(fitsDog(p('10kg 미만'), 'medium')).toBe('no');
    expect(fitsDog(p('가게에 문의'), 'large')).toBe('unknown');
  });
});
