import React from "react";
import rough from "roughjs";

const gen = rough.generator();

/** Stable seed from any string, so the same shape wobbles the same way on every frame. */
const seedOf = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (Math.abs(h) % 100000) + 1;
};

/** A rough.js shape drawn on like a pen stroke (progress 0 -> 1). */
const DrawOn: React.FC<{ paths: { d: string }[]; color: string; width: number; progress: number }> = ({
  paths,
  color,
  width,
  progress,
}) => (
  <>
    {paths.map((p, i) => (
      <path
        key={i}
        d={p.d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - Math.max(0, Math.min(1, progress * paths.length - i))}
      />
    ))}
  </>
);

/** Rough rectangle that stretches to fill its parent (used around inline text). */
export const RoughBox: React.FC<{ id: string; color: string; progress: number; width?: number }> = ({
  id,
  color,
  progress,
  width = 4,
}) => {
  const shape = gen.rectangle(3, 3, 194, 94, { seed: seedOf(id), roughness: 1.3, bowing: 1.2, stroke: color });
  const paths = gen.toPaths(shape);
  return (
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: "-0.12em -0.2em -0.06em -0.2em", width: "calc(100% + 0.4em)", height: "calc(100% + 0.18em)", overflow: "visible" }}
    >
      <DrawOn paths={paths} color={color} width={width} progress={progress} />
    </svg>
  );
};

/** Rough line or arrow between two points in frame pixels. */
export const RoughLine: React.FC<{
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  arrow?: boolean;
  progress: number;
  opacity?: number;
}> = ({ id, x1, y1, x2, y2, color, arrow, progress, opacity = 1 }) => {
  const seed = seedOf(id);
  const paths = gen.toPaths(gen.line(x1, y1, x2, y2, { seed, roughness: 1.4, bowing: 2, stroke: color }));
  if (arrow) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const len = 30;
    for (const side of [-1, 1]) {
      const ax = x2 - len * Math.cos(a + side * 0.5);
      const ay = y2 - len * Math.sin(a + side * 0.5);
      paths.push(...gen.toPaths(gen.line(x2, y2, ax, ay, { seed: seed + side + 7, roughness: 1, stroke: color })));
    }
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
      <DrawOn paths={paths} color={color} width={5} progress={progress} />
    </svg>
  );
};
