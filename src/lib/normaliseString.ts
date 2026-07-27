/**
 * Normalises a string for lenient country-name matching: strips accents,
 * lowercases, and collapses punctuation and whitespace into single spaces.
 */
export function normaliseString(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') // punctuation/hyphens/apostrophes -> space
    .trim();
}
