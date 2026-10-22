import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { exitOut, float, glide, pop, sec } from "../anim";
import { GridBackground } from "../components/GridBackground";
import { MathText, plainMath } from "../components/MathText";
import { Sounds, type SoundCue } from "../components/Sounds";
import { T } from "../episode";
import { useEpisode } from "../EpisodeContext";
import { fitSize } from "../text";
import { SAFE, theme } from "../theme";
import { Check } from "./ProofScene";

/** Same green as the portal's "Accepted" badge. */
const GREEN = "#15803d";
const LETTERS = ["A", "B", "C", "D"];
const PIECE_GAP = 12; // frames between the pieces of one math line

/** "SAT MATH" + section chips at the top of every solve scene. */
const Header: React.FC<{ settled?: boolean }> = ({ settled }) => {
  const { solve } = useEpisode();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = settled ? 1 : pop(frame, fps, 0, 240);
  return (
    <div
      style={{
        position: "absolute",
        top: SAFE.top + 34,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 16,
        opacity: p,
        transform: `translateY(${(1 - p) * -40}px)`,
      }}
    >
      <span
        style={{
          padding: "16px 34px",
          borderRadius: theme.radius.pill,
          background: theme.gradient.button,
          color: theme.color.white,
          fontFamily: theme.font.heading,
          fontWeight: 900,
          fontSize: 38,
          letterSpacing: 3,
          textTransform: "uppercase",
          boxShadow: theme.shadow.crimsonButton,
        }}
      >
        {solve!.seriesLabel}
      </span>
      <span
        style={{
          padding: "16px 30px",
          borderRadius: theme.radius.pill,
          border: `3px solid ${theme.color.pinkBorder}`,
          backgroundColor: theme.color.white,
          color: theme.color.crimson,
          fontFamily: theme.font.heading,
          fontWeight: 800,
          fontSize: 36,
        }}
      >
        {solve!.section}
      </span>
    </div>
  );
};

/** The question, big, with a pulsing "pause and try it" prompt. */
export const ProblemScene: React.FC = () => {
  const { solve } = useEpisode();
  const s = solve!;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = exitOut(frame, sec(T.problem, fps), 5);
  const card = glide(frame, fps, 6);
  const pause = pop(frame, fps, sec(1.6, fps), 240);
  const breathe = 1 + Math.sin(frame * 0.18) * 0.04;
  const qSize = fitSize([plainMath(s.question).slice(0, Math.ceil(plainMath(s.question).length / 3))], 74, 820);
  return (
    <AbsoluteFill>
      <GridBackground glow />
      <AbsoluteFill style={{ opacity: out }}>
        <Header />
        <div
          style={{
            position: "absolute",
            top: 470,
            left: 70,
            right: 70,
            padding: "70px 60px",
            borderRadius: theme.radius.card,
            backgroundColor: theme.color.white,
            border: `4px solid ${theme.color.pinkBorder}`,
            boxShadow: theme.shadow.card,
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: qSize,
            lineHeight: 1.45,
            color: theme.color.ink,
            opacity: card,
            transform: `translateY(${(1 - card) * 160 + float(frame, 5, 0.08)}px) rotate(${(1 - card) * 3}deg)`,
          }}
        >
          <MathText text={s.question} />
          {s.options ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 40, fontSize: qSize * 0.85 }}>
              {s.options.map((o, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                  <span style={{ color: theme.color.crimson, fontWeight: 900 }}>{LETTERS[i]})</span>
                  <MathText text={o} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div
          style={{
            position: "absolute",
            top: 1290,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: pause,
            transform: `scale(${(0.6 + pause * 0.4) * breathe})`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "22px 44px 22px 26px",
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.ink,
              color: theme.color.white,
              fontFamily: theme.font.heading,
              fontWeight: 800,
              fontSize: 48,
            }}
          >
            <span
              style={{
                width: 66,
                height: 66,
                borderRadius: 999,
                backgroundColor: theme.color.crimson,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
              }}
            >
              <span style={{ width: 9, height: 28, backgroundColor: "white", borderRadius: 2 }} />
              <span style={{ width: 9, height: 28, backgroundColor: "white", borderRadius: 2 }} />
            </span>
            {s.pauseLine}
          </div>
        </div>
      </AbsoluteFill>
      <Sounds
        cues={[
          { file: "audio/whoosh.wav", at: 0.15 },
          { file: "audio/pop.wav", at: 1.6 },
        ]}
      />
    </AbsoluteFill>
  );
};

/** One worked step: number, label, and a math line whose pieces (split on " = ") appear one by one. */
const Step: React.FC<{ n: number; label: string; math: string[]; start: number; active: boolean; size: number }> = ({
  n,
  label,
  math,
  start,
  active,
  size,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, start, 220);
  const done = interpolate(frame, [start + sec(T.step, fps) - 6, start + sec(T.step, fps) + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dim = active ? 1 : 1 - done * 0.45;
  return (
    <div
      style={{
        display: "flex",
        gap: 28,
        alignItems: "flex-start",
        opacity: p * dim,
        transform: `translateY(${(1 - p) * 60}px) scale(${0.96 + p * 0.04})`,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 76,
          height: 76,
          borderRadius: 999,
          background: theme.gradient.button,
          color: theme.color.white,
          fontFamily: theme.font.heading,
          fontWeight: 900,
          fontSize: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: theme.shadow.crimsonButton,
          marginTop: 6,
        }}
      >
        {n}
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: theme.color.crimson,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: size,
            lineHeight: 1.35,
            color: theme.color.ink,
            whiteSpace: "nowrap",
          }}
        >
          {math.map((piece, i) => {
            const q = pop(frame, fps, start + 8 + i * PIECE_GAP, 260);
            const last = i === math.length - 1;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: q,
                  transform: `translateY(${(1 - q) * 30}px)`,
                  color: last ? theme.color.crimson : undefined,
                }}
              >
                {i > 0 ? <span style={{ color: theme.color.muted, margin: "0 0.3em" }}>=</span> : null}
                <MathText text={piece} />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Whiteboard: the question stays small on top, steps stack underneath. */
export const StepsScene: React.FC = () => {
  const { solve } = useEpisode();
  const s = solve!;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(s.steps.length * T.step + 0.6, fps);
  const out = exitOut(frame, duration, 5);
  const board = glide(frame, fps, 0);
  const stepLen = sec(T.step, fps);
  const current = Math.min(s.steps.length - 1, Math.floor(frame / stepLen));
  const mathSize = fitSize(
    s.steps.map((st) => st.math.map(plainMath).join(" = ")),
    96,
    840,
  );
  const sounds: SoundCue[] = s.steps.flatMap((st, k) => [
    { file: "audio/whoosh.wav", at: (k * stepLen) / fps, volume: 0.4 },
    ...st.math.map((_, i) => ({ file: "audio/pop.wav", at: (k * stepLen + 8 + i * PIECE_GAP) / fps, volume: 0.45 })),
  ]);
  return (
    <AbsoluteFill>
      <GridBackground glow />
      <AbsoluteFill style={{ opacity: out }}>
        <Header settled />
        {/* question recap */}
        <div
          style={{
            position: "absolute",
            top: 330,
            left: 70,
            right: 70,
            padding: "26px 34px",
            borderRadius: theme.radius.button,
            backgroundColor: theme.color.pinkBg,
            border: `3px solid ${theme.color.pinkBorder}`,
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: fitSize([plainMath(s.question).slice(0, Math.ceil(plainMath(s.question).length / 2))], 42, 880),
            lineHeight: 1.4,
            color: theme.color.body,
            opacity: board,
          }}
        >
          <MathText text={s.question} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 640,
            left: 60,
            right: 50,
            display: "flex",
            flexDirection: "column",
            gap: 92,
            transform: `translateY(${float(frame, 3, 0.06)}px)`,
          }}
        >
          {s.steps.map((st, k) => (
            <Step
              key={k}
              n={k + 1}
              label={st.label}
              math={st.math}
              start={k * stepLen}
              active={k === current}
              size={mathSize}
            />
          ))}
        </div>
      </AbsoluteFill>
      <Sounds cues={sounds} />
    </AbsoluteFill>
  );
};

/** The answer, big and green, plus the one-line lesson. */
export const ResultScene: React.FC = () => {
  const { solve } = useEpisode();
  const s = solve!;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = exitOut(frame, sec(T.result, fps), 5);
  const badge = pop(frame, fps, 0, 200);
  const num = pop(frame, fps, 6, 220);
  const line = pop(frame, fps, 22);
  const burst = interpolate(frame, [4, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <GridBackground glow />
      <AbsoluteFill style={{ opacity: out }}>
        <Header settled />
        {/* ring burst behind the badge */}
        <div
          style={{
            position: "absolute",
            top: 560 - 150 * burst,
            left: 540 - 150 - 150 * burst,
            width: 300 + 300 * burst,
            height: 300 + 300 * burst,
            borderRadius: 999,
            border: `6px solid ${GREEN}`,
            opacity: (1 - burst) * 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 390,
            width: 300,
            height: 300,
            borderRadius: 999,
            backgroundColor: GREEN,
            boxShadow: "0 30px 60px rgba(21,128,61,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: badge,
            transform: `scale(${0.4 + badge * 0.6})`,
          }}
        >
          <Check size={170} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 900,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 900,
            letterSpacing: -2,
            opacity: num,
            transform: `scale(${0.6 + num * 0.4}) translateY(${float(frame, 4, 0.1)}px)`,
          }}
        >
          <div style={{ fontSize: 56, color: theme.color.body, letterSpacing: 4 }}>ANSWER</div>
          <div
            style={{
              display: "inline-block",
              fontSize: 220,
              lineHeight: 1,
              backgroundImage: theme.gradient.headlineText,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              paddingBottom: 10,
            }}
          >
            {s.answer}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 1280,
            left: 70,
            right: 70,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: fitSize([s.takeaway], 56, 940),
            color: theme.color.ink,
            opacity: line,
            transform: `translateY(${(1 - line) * 30}px)`,
          }}
        >
          <MathText text={s.takeaway} />
        </div>
      </AbsoluteFill>
      <Sounds
        cues={[
          { file: "audio/ding.wav", at: 0.05 },
          { file: "audio/hit.wav", at: 0.2, volume: 0.5 },
          { file: "audio/pop.wav", at: 22 / fps, volume: 0.5 },
        ]}
      />
    </AbsoluteFill>
  );
};
