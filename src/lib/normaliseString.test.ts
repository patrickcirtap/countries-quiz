import { describe, it, expect } from 'vitest';
import { normaliseString } from './normaliseString';

describe('normaliseString', () => {
  it('lowercases and trims surrounding whitespace', () => {
    expect(normaliseString('  France  ')).toBe('france');
  });

  it('collapses inner whitespace and punctuation to single spaces', () => {
    expect(normaliseString('United   States')).toBe('united states');
    expect(normaliseString("Cote d'Ivoire")).toBe('cote d ivoire');
    expect(normaliseString('Timor-Leste')).toBe('timor leste');
  });

  it('strips accents', () => {
    expect(normaliseString('Côte')).toBe('cote');
    expect(normaliseString('São Tomé')).toBe('sao tome');
  });
});
