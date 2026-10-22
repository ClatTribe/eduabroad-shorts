/**
 * Text fitting so automatically written lines never overflow the frame.
 * Widths are estimated per character for Montserrat Black (in em), calibrated
 * against real renders: wide letters (M, W, m, w) take ~0.86em, narrow ones
 * (i, l, t, f, r) ~0.32em, spaces ~0.28em.
 */
const WIDE = new Set("MWmw@");
const NARROW = new Set("iljtfrI!.,:;'|");
const charEm = (c: string) => {
  if (c === " ") return 0.28;
  if (WIDE.has(c)) return 0.86;
  if (NARROW.has(c)) return 0.32;
  if (c === "?") return 0.5;
  if (/[A-Z]/.test(c)) return 0.68;
  if (/[0-9]/.test(c)) return 0.6;
  return 0.56;
};

/** Estimated width of a line in em. */
export const estimateEm = (text: string) => [...text].reduce((sum, c) => sum + charEm(c), 0);

/**
 * Largest font size (capped at `maxSize`) at which every line fits in `maxWidth` px.
 * `extraEm` adds fixed spacing per line (e.g. gaps around animated words).
 */
export const fitSize = (lines: string[], maxSize: number, maxWidth = 940, extraEm: (line: string) => number = () => 0, minSize = 40) => {
  const widest = Math.max(0.1, ...lines.map((l) => estimateEm(l) + extraEm(l)));
  return Math.max(minSize, Math.min(maxSize, Math.floor(maxWidth / widest)));
};
