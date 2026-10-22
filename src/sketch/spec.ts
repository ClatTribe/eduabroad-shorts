/**
 * A "sketch" Short: a whiteboard that draws itself (hand-drawn lines, handwriting, highlighter).
 * One JSON file per video, e.g. sketches/sat-exponent-trick.json.
 *
 * Text uses a small markup:
 *   {blue|2^{x}}          colour (ink, red, blue, green, orange, purple, muted)
 *   2^{2x} or 5^2         superscript
 *   {box blue 9.3|2^{x}}  hand-drawn box around the text, drawn at 9.3 s
 *   {hl 15|155}           yellow highlighter swipe at 15 s
 * Everything else is written on at the item's `at` time.
 */

export type SketchItem =
  | {
      kind: "text";
      at: number; // seconds: starts writing
      dur?: number; // seconds of writing (default from length)
      out?: number; // seconds: fades away (optional)
      text: string;
      y: number; // px from top (1080 x 1920 frame)
      x?: number; // px from left (left-aligned); leave out to centre
      size: number;
      color?: string;
    }
  | {
      kind: "line"; // hand-drawn line or arrow
      at: number;
      dur?: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color?: string;
      arrow?: boolean;
      out?: number;
    };

export type SketchSpec = {
  id: string;
  seconds: number;
  chips: { tag: string; sub: string };
  items: SketchItem[];
  /** Extra sound effects (seconds from the start), e.g. the answer "ding". */
  sfx?: { file: string; at: number; volume?: number }[];
  youtube: { title: string; description: string; tags: string[] };
  instagram: { caption: string };
  claims: { text: string; source: string }[];
};

export const INK = {
  ink: "#1e1e1e",
  red: "#A51C30", // EduAbroad crimson doubles as the "red" pen
  blue: "#1971c2",
  green: "#2f9e44",
  orange: "#e8590c",
  purple: "#7048e8",
  muted: "#868e96",
  highlighter: "#ffec4d",
};

export const inkColor = (name?: string) => (name ? (INK as Record<string, string>)[name] ?? name : INK.ink);

/** Default writing time: a steady hand, never slower than 1.6 s per line. */
export const writeSeconds = (plainLength: number) => Math.min(1.6, Math.max(0.45, plainLength * 0.045));
