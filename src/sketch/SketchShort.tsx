import React from "react";
import {
  AbsoluteFill,
  Audio,
  cancelRender,
  Img,
  continueRender,
  delayRender,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFonts } from "../fonts";
import { SFX_VOLUME } from "../settings";
import { decorations, Markup, parse, plain } from "./Markup";
import { RoughLine, RoughPoly } from "./Rough";
import { INK, inkColor, writeSeconds, type SketchItem, type SketchSpec } from "./spec";

loadFonts();

// Virgil: the open-source (SIL OFL) handwriting font from Excalidraw, bundled in public/fonts.
let virgilStarted = false;
const loadVirgil = () => {
  if (virgilStarted || typeof document === "undefined") return;
  virgilStarted = true;
  const handle = delayRender("Loading Virgil");
  new FontFace("Virgil", `url(${staticFile("fonts/virgil.woff2")}) format("woff2")`)
    .load()
    .then((face) => {
      document.fonts.add(face);
      continueRender(handle);
    })
    .catch((err) => cancelRender(err));
};
loadVirgil();

const HAND = "Virgil, 'Comic Sans MS', cursive";
export const SKETCH_MUSIC = { file: "audio/sketch-music.wav", volume: 0.5, underVoice: 0.2 };

const fadeOut = (t: number, out?: number) =>
  out === undefined ? 1 : interpolate(t, [out - 0.35, out], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Notebook paper in EduAbroad's homepage grid. */
const Paper: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#ffffff",
      backgroundImage: `linear-gradient(to right, ${INK.paperGrid} 2px, transparent 2px), linear-gradient(to bottom, ${INK.paperGrid} 2px, transparent 2px)`,
      backgroundSize: "90px 90px",
      backgroundPosition: "-20px -20px",
    }}
  />
);

/** Header: EduAbroad logo on the left, crimson topic tag on the right. */
const Header: React.FC<{ tag: string; sub: string }> = ({ tag, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 3, fps, config: { damping: 14, stiffness: 200, mass: 0.6 } });
  const logo = spring({ frame, fps, config: { damping: 16, stiffness: 160, mass: 0.6 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 200,
        left: 60,
        right: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Img
        src={staticFile("brand/edulogo-clean.png")}
        style={{ height: 66, opacity: logo, transform: `translateX(${(1 - logo) * -40}px)` }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 22px 8px 8px",
          borderRadius: 999,
          backgroundColor: "#FEF2F3",
          border: "2px solid #FECDD3",
          fontFamily: "Lato, sans-serif",
          fontWeight: 700,
          fontSize: 30,
          color: "#A51C30",
          opacity: p,
          transform: `scale(${0.7 + p * 0.3})`,
        }}
      >
        <span
          style={{
            padding: "7px 20px",
            borderRadius: 999,
            background: "linear-gradient(to right, #A51C30, #8A1828)",
            color: "#ffffff",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: 1,
          }}
        >
          {tag}
        </span>
        {sub}
      </div>
    </div>
  );
};

/** A picture (e.g. the logo) wiped on left to right. */
const ImageItem: React.FC<{ item: Extract<SketchItem, { kind: "image" }>; t: number }> = ({ item, t }) => {
  const p = interpolate(t, [item.at, item.at + (item.dur ?? 0.6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", top: item.y, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: fadeOut(t, item.out) }}>
      <Img src={staticFile(item.src)} style={{ height: item.height, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }} />
    </div>
  );
};

/** One handwritten line: wiped on left to right at a writing pace. */
const TextItem: React.FC<{ item: Extract<SketchItem, { kind: "text" }>; index: number; t: number }> = ({ item, index, t }) => {
  const nodes = parse(item.text);
  const dur = item.dur ?? writeSeconds(plain(nodes).length);
  const p = interpolate(t, [item.at, item.at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (p <= 0) return null;
  const centred = item.x === undefined;
  return (
    <div
      style={{
        position: "absolute",
        top: item.y,
        left: centred ? 40 : item.x,
        right: centred ? 40 : undefined,
        textAlign: centred ? "center" : "left",
        whiteSpace: "pre", // keeps deliberate extra spaces (e.g. between answer options)
        fontFamily: HAND,
        fontSize: item.size,
        lineHeight: 1.2,
        color: inkColor(item.color),
        opacity: fadeOut(t, item.out),
      }}
    >
      {/* inline-block so the wipe follows the text, not the full frame width */}
      <span
        style={{
          display: "inline-block",
          clipPath: p >= 1 ? undefined : `inset(-80px ${(1 - p) * 100}% -80px -80px)`,
        }}
      >
        <Markup nodes={nodes} t={t} idBase={`i${index}`} />
      </span>
    </div>
  );
};

/** Sound cues: marker pen while writing, a short stroke for each box, a swish for each highlight. */
type Cue = { file: string; at: number; seconds?: number; volume?: number };
const cuesFor = (spec: SketchSpec): Cue[] => {
  const cues: Cue[] = [];
  for (const it of spec.items) {
    if (it.kind === "text") {
      const nodes = parse(it.text);
      const dur = it.dur ?? writeSeconds(plain(nodes).length);
      cues.push({ file: "audio/pen.wav", at: it.at, seconds: dur, volume: 0.55 });
      for (const d of decorations(nodes))
        cues.push(d.kind === "box" ? { file: "audio/pen-scribble.wav", at: d.at, volume: 0.5 } : { file: "audio/marker.wav", at: d.at, volume: 0.6 });
    } else if (it.kind === "poly") {
      cues.push({ file: "audio/pen.wav", at: it.at, seconds: it.dur ?? 1, volume: 0.5 });
    } else if (it.kind === "image") {
      cues.push({ file: "audio/marker.wav", at: it.at, volume: 0.5 });
    } else {
      cues.push({ file: "audio/pen-scribble.wav", at: it.at, volume: 0.45 });
    }
  }
  return [...cues, ...(spec.sfx ?? [])];
};

export type SketchProps = { spec: SketchSpec };

export const SketchShort: React.FC<SketchProps> = ({ spec }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  // fade everything to blank paper at the very end so the loop restarts cleanly
  const endFade = interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      <Paper />
      <AbsoluteFill style={{ opacity: endFade }}>
        <Header tag={spec.chips.tag} sub={spec.chips.sub} />
        {spec.items.map((it, i) =>
          it.kind === "text" ? (
            <TextItem key={i} item={it} index={i} t={t} />
          ) : it.kind === "image" ? (
            <ImageItem key={i} item={it} t={t} />
          ) : it.kind === "poly" ? (
            <RoughPoly
              key={i}
              id={`p${i}`}
              points={it.points}
              closed={it.closed}
              color={inkColor(it.color)}
              width={it.width}
              opacity={fadeOut(t, it.out)}
              progress={interpolate(t, [it.at, it.at + (it.dur ?? 1)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            />
          ) : it.kind === "right-angle" ? (
            <RoughPoly
              key={i}
              id={`r${i}`}
              points={[
                [it.x + it.dx * (it.size ?? 34), it.y],
                [it.x + it.dx * (it.size ?? 34), it.y + it.dy * (it.size ?? 34)],
                [it.x, it.y + it.dy * (it.size ?? 34)],
              ]}
              color={inkColor(it.color)}
              width={4}
              progress={interpolate(t, [it.at, it.at + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            />
          ) : (
            <RoughLine
              key={i}
              id={`l${i}`}
              x1={it.x1}
              y1={it.y1}
              x2={it.x2}
              y2={it.y2}
              color={inkColor(it.color)}
              arrow={it.arrow}
              width={it.width}
              opacity={fadeOut(t, it.out)}
              progress={interpolate(t, [it.at, it.at + (it.dur ?? 0.4)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            />
          ),
        )}
      </AbsoluteFill>
      {cuesFor(spec).map((c, i) => (
        <Sequence
          key={i}
          from={Math.round(c.at * fps)}
          durationInFrames={c.seconds ? Math.max(1, Math.round(c.seconds * fps)) : undefined}
          layout="none"
        >
          <Audio src={staticFile(c.file)} volume={(c.volume ?? 0.7) * SFX_VOLUME} />
        </Sequence>
      ))}
      {spec.voice ? <Audio src={staticFile(`voice/${spec.id}.wav`)} volume={1} /> : null}
      <Audio src={staticFile(SKETCH_MUSIC.file)} volume={spec.voice ? SKETCH_MUSIC.underVoice : SKETCH_MUSIC.volume} />
    </AbsoluteFill>
  );
};
