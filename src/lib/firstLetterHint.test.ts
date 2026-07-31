import { describe, it, expect } from 'vitest';
import { firstLetterHint } from './firstLetterHint';

describe('firstLetterHint', () => {
  it('keeps the first letter and dashes the rest', () => {
    expect(firstLetterHint('Brazil')).toBe('B -  -  -  -  - ');
  });

  it('keeps the first letter of every word', () => {
    // The doubled spaces collapse when rendered, giving "S - - - - K - ..."
    expect(firstLetterHint('Saint Kitts and Nevis')).toBe(
      'S -  -  -  -  K -  -  -  -  a -  -  N -  -  -  - ',
    );
  });

  it('handles single letters and empty names', () => {
    expect(firstLetterHint('A')).toBe('A');
    expect(firstLetterHint('')).toBe('');
  });
});
