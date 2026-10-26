import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { exitOut, float, glide, pop, sec } from "../anim";
import { GridBackground } from "../components/GridBackground";
import { Sounds, type SoundCue } from "../components/Sounds";
import { T } from "../episode";
import { useEpisode } from "../EpisodeContext";
import { fitSize } from "../text";
import { SAFE, theme } from "../theme";
import { Check } from "./ProofScene";

/** Same green as the portal's "Accepted" badge. */
const GREEN = "#15803d";
const LETTERS = ["A", "B", "C", "D"];

// Question scene timeline (seconds)
const OPTIONS_AT = 3.0; // passage gets 3 seconds to be read first
const COUNT_FROM = 4.0; // then a 5 second countdown
const COUNT = 5;

type Phase = "question" | "answer";

/** Countdown ring that sits on the corner of the question card. */
const Timer: React.FC<{ phase: Phase; frame: number }> = ({ phase, frame }) => {
  const { fps } = useVideoConfig();
  const size = 156;
  const r = 62;
  const circ = 2 * Math.PI * r;
  const appear = phase === "answer" ? 1 : pop(frame, fps, sec(COUNT_FROM - 0.3, fps), 260);
  const elapsed = Math.max(0, frame / fps - COUNT_FROM);
  const left = phase === "answer" ? 0 : Math.max(0, 1 - elapsed / COUNT);
  const n = Math.max(0, COUNT - Math.floor(elapsed));
  const sinceTick = (elapsed % 1) * fps;
  const beat = phase === "question" && elapsed > 0 && n > 0 ? 1 + Math.max(0, 1 - sinceTick / 8) * 0.12 : 1;
  const done = phase === "question" && n === 0;
  const shake = done ? Math.sin(frame * 2.6) * 6 * Math.max(0, 1 - (elapsed - COUNT) * 2) : 0;
  return (
    <div
      style={{
        position: "absolute",
        top: -96,
        right: -14,
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: phase === "answer" ? GREEN : theme.color.white,
        boxShadow: theme.shadow.crimsonButton,
        opacity: appear,
        transform: `scale(${(0.4 + appear * 0.6) * beat}) translateX(${shake}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {phase === "answer" ? (
        <Check size={92} />
      ) : (
        <>
          <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} stroke={theme.color.pinkBorder} strokeWidth={14} fill="none" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={theme.color.crimson}
              strokeWidth={14}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - left)}
            />
          </svg>
          <span
            style={{
              fontFamily: theme.font.heading,
              fontWeight: 900,
              fontSize: 72,
              color: theme.color.crimson,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {n}
          </span>
        </>
      )}
    </div>
  );
};

/** The quiz card: prompt, question with a blank, four options, countdown. Shared by the question and answer scenes. */
const QuizBoard: React.FC<{ phase: Phase }> = ({ phase }) => {
  const { quiz } = useEpisode();
  const q = quiz!;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const settled = phase === "answer"; // answer scene starts with everything already in place
  const at = (delay: number, stiffness?: number) => (settled ? 1 : pop(frame, fps, delay, stiffness));
  const pill = at(0, 240);
  const prompt = at(5);
  const card = settled ? 1 : glide(frame, fps, 8);
  const optionsAt = sec(OPTIONS_AT, fps);

  // answer reveal (answer scene only)
  const reveal = phase === "answer" ? pop(frame, fps, 3, 220) : 0;
  const dim = phase === "answer" ? interpolate(frame, [3, 14], [1, 0.32], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const fill = phase === "answer" ? pop(frame, fps, 9, 260) : 0;

  const [before, after] = q.passage.split("____");
  const answerText = q.options[q.answer];
  const passageSize = fitSize([q.passage.slice(0, Math.ceil(q.passage.length / 4))], 50, 860);
  const optionSize = fitSize(q.options, 50, 700);

  return (
    <AbsoluteFill>
      <GridBackground glow />
      {/* series + section */}
      <div
        style={{
          position: "absolute",
          top: SAFE.top + 34,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          opacity: pill,
          transform: `translateY(${(1 - pill) * -40}px)`,
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
          {q.seriesLabel}
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
          {q.section}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: 340,
          left: 70,
          right: 70,
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: fitSize([q.prompt], 66, 760),
            color: theme.color.ink,
            letterSpacing: -1,
            opacity: prompt,
            transform: `translateX(${(1 - prompt) * -60}px)`,
          }}
        >
          {q.prompt}
        </div>

        {/* question card */}
        <div
          style={{
            position: "relative",
            padding: "72px 48px 44px",
            borderRadius: theme.radius.card,
            backgroundColor: theme.color.white,
            border: `4px solid ${theme.color.pinkBorder}`,
            boxShadow: theme.shadow.card,
            fontFamily: theme.font.body,
            fontWeight: 700,
            fontSize: passageSize,
            lineHeight: 1.5,
            color: theme.color.ink,
            opacity: card,
            transform: `translateY(${(1 - card) * 160 + float(frame, 4, 0.07)}px)`,
          }}
        >
          {before}
          <span
            style={{
              display: "inline-block",
              minWidth: fill > 0.05 ? 0 : 230,
              padding: "0 10px",
              margin: "0 4px",
              borderBottom: `6px solid ${fill > 0.05 ? GREEN : theme.color.crimson}`,
              color: GREEN,
              fontWeight: 900,
              lineHeight: 1.2,
              transform: `scale(${fill > 0.05 ? 0.7 + fill * 0.3 : 1})`,
            }}
          >
            {fill > 0.05 ? answerText : " "}
          </span>
          {after}
          <Timer phase={phase} frame={frame} />
        </div>

        {/* options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {q.options.map((opt, i) => {
            const p = at(optionsAt + i * 6, 260);
            const correct = i === q.answer;
            const r = correct ? reveal : 0;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                  padding: "14px 28px",
                  borderRadius: theme.radius.button,
                  backgroundColor: r > 0.05 ? GREEN : theme.color.white,
                  border: `4px solid ${r > 0.05 ? GREEN : theme.color.pinkBorder}`,
                  boxShadow: r > 0.05 ? "0 22px 44px rgba(21,128,61,0.32)" : theme.shadow.soft,
                  opacity: p * (correct ? 1 : dim),
                  transform: `translateX(${(1 - p) * 140}px) scale(${correct ? 1 + r * 0.05 : 1 - (1 - dim) * 0.05})`,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 74,
                    height: 74,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: r > 0.05 ? theme.color.white : theme.color.pinkBg,
                    color: r > 0.05 ? GREEN : theme.color.crimson,
                    fontFamily: theme.font.heading,
                    fontWeight: 900,
                    fontSize: 40,
                  }}
                >
                  {LETTERS[i]}
                </span>
                <span
                  style={{
                    fontFamily: theme.font.heading,
                    fontWeight: 800,
                    fontSize: optionSize,
                    color: r > 0.05 ? theme.color.white : theme.color.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  {opt}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Bottom line under the options: asks for comments, then confirms the answer. */
const BottomLine: React.FC<{ text: string; delay: number; color: string }> = ({ text, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, delay);
  return (
    <div
      style={{
        position: "absolute",
        top: 1440,
        left: 60,
        right: 60,
        textAlign: "center",
        fontFamily: theme.font.heading,
        fontWeight: 800,
        fontSize: fitSize([text], 52, 940),
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 30 + float(frame, 4, 0.12)}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const QuestionScene: React.FC = () => {
  const { quiz } = useEpisode();
  const { fps } = useVideoConfig();
  const sounds: SoundCue[] = [
    { file: "audio/whoosh.wav", at: 0.2 },
    ...(quiz?.options ?? []).map((_, i) => ({ file: "audio/pop.wav", at: OPTIONS_AT + (i * 6) / fps, volume: 0.5 })),
    ...Array.from({ length: COUNT }, (_, i) => ({ file: "audio/tick.wav", at: COUNT_FROM + i, volume: 0.9 })),
    { file: "audio/timeup.wav", at: COUNT_FROM + COUNT },
  ];
  return (
    <AbsoluteFill>
      <QuizBoard phase="question" />
      <BottomLine text="Comment: A, B, C or D?" delay={sec(COUNT_FROM, fps)} color={theme.color.crimson} />
      <Sounds cues={sounds} />
    </AbsoluteFill>
  );
};

export const AnswerScene: React.FC = () => {
  const { quiz } = useEpisode();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = exitOut(frame, sec(T.answer, fps), 5);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <QuizBoard phase="answer" />
      <BottomLine text={`Sahi answer: ${LETTERS[quiz!.answer]}`} delay={6} color={GREEN} />
      <Sounds
        cues={[
          { file: "audio/ding.wav", at: 0.1 },
          { file: "audio/pop.wav", at: 0.3, volume: 0.5 },
        ]}
      />
    </AbsoluteFill>
  );
};

/** "Kyun?": the key phrase with the deciding character circled, then three short reasons. */
export const WhyScene: React.FC = () => {
  const { quiz } = useEpisode();
  const why = quiz!.why;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = exitOut(frame, sec(T.why, fps), 5);
  const title = pop(frame, fps, 0, 240);
  const focus = pop(frame, fps, 8, 220);
  const ring = interpolate(frame, [22, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const STAGGER = 26;
  const first = 44;
  // the deciding character (an apostrophe here) gets circled
  const k = Math.max(why.focus.indexOf("’"), why.focus.indexOf("'"));
  const pointSize = fitSize(
    why.points.map((p) => p.slice(0, Math.ceil(p.length / 2))),
    50,
    700,
  );
  return (
    <AbsoluteFill>
      <GridBackground glow />
      <AbsoluteFill style={{ opacity: out }}>
        <div
          style={{
            position: "absolute",
            top: SAFE.top + 70,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: 120,
            letterSpacing: -3,
            opacity: title,
            transform: `scale(${0.6 + title * 0.4})`,
          }}
        >
          <span
            style={{
              backgroundImage: theme.gradient.headlineText,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              paddingBottom: 8,
            }}
          >
            {why.title}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            top: 470,
            left: 40,
            right: 40,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: fitSize([why.focus], 116, 900),
            color: GREEN,
            opacity: focus,
            transform: `translateY(${(1 - focus) * 50 + float(frame, 5, 0.1)}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {k >= 0 ? why.focus.slice(0, k) : why.focus}
          {k >= 0 ? (
            <span style={{ position: "relative", color: theme.color.crimson }}>
              {why.focus[k]}
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "30%",
                  width: 100,
                  height: 100,
                  marginLeft: -50,
                  marginTop: -50,
                  borderRadius: 999,
                  border: `8px solid ${theme.color.crimson}`,
                  opacity: ring,
                  transform: `scale(${0.4 + ring * 0.6 + (ring >= 1 ? Math.sin(frame * 0.25) * 0.05 : 0)})`,
                }}
              />
            </span>
          ) : null}
          {k >= 0 ? why.focus.slice(k + 1) : null}
        </div>
        <div style={{ position: "absolute", top: 720, left: 70, right: 70, display: "flex", flexDirection: "column", gap: 28 }}>
          {why.points.map((pt, i) => {
            const p = pop(frame, fps, first + i * STAGGER);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 30,
                  padding: "30px 36px",
                  borderRadius: theme.radius.card,
                  backgroundColor: theme.color.white,
                  border: `4px solid ${theme.color.pinkBorder}`,
                  boxShadow: theme.shadow.card,
                  opacity: p,
                  transform: `translateX(${(1 - p) * (i % 2 ? 120 : -120)}px)`,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 84,
                    height: 84,
                    borderRadius: 999,
                    background: theme.gradient.button,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: theme.shadow.crimsonButton,
                  }}
                >
                  <Check size={52} />
                </span>
                <span
                  style={{
                    fontFamily: theme.font.heading,
                    fontWeight: 800,
                    fontSize: pointSize,
                    lineHeight: 1.2,
                    color: theme.color.ink,
                  }}
                >
                  {pt}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Sounds
        cues={[
          { file: "audio/whoosh.wav", at: 0 },
          { file: "audio/pop.wav", at: 22 / fps },
          ...why.points.map((_, i) => ({ file: "audio/ding.wav", at: (first + i * STAGGER + 3) / fps, volume: 0.5 })),
        ]}
      />
    </AbsoluteFill>
  );
};
