/**
 * Rough text fitting so automatically written lines never overflow the frame.
 * Montserrat Black averages ~0.62em per character; we size the font so the
 * longest line fits inside `maxWidth` pixels, capped at `maxSize`.
 */
export const fitSize = (lines: string[], maxSize: number, maxWidth = 940, charEm = 0.62, minSize = 44) => {
  const longest = Math.max(1, ...lines.map((l) => l.length));
  return Math.max(minSize, Math.min(maxSize, Math.floor(maxWidth / (longest * charEm))));
};
