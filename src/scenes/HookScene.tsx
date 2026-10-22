import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { exitOut, float, pop, sec } from "../anim";
import { GridBackground } from "../components/GridBackground";
import { Sounds, type SoundCue } from "../components/Sounds";
import { T } from "../episode";
import { useEpisode } from "../EpisodeContext";
import { fitSize } from "../text";
import { theme } from "../theme";

const WORD_GAP = 6; // frames between words

const Word: React.FC<{ text: string; index: number; highlight: boolean }> = ({ text, index, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, index * WORD_GAP, 260);
  const punch = highlight ? interpolate(p, [0, 0.7, 1], [0, 1.25, 1]) : p;
  return (
    <span
      style={{
        display: "inline-block",
        margin: "0 0.12em",
        opacity: Math.min(1, p * 1.4),
        transform: `translateY(${(1 - p) * 60}px) scale(${0.6 + punch * 0.4}) rotate(${highlight ? (1 - p) * -12 : 0}deg)`,
        backgroundImage: highlight ? theme.gradient.headlineText : undefined,
        WebkitBackgroundClip: highlight ? "text" : undefined,
        WebkitTextFillColor: highlight ? "transparent" : undefined,
        color: highlight ? undefined : theme.color.ink,
        paddingBottom: 8,
      }}
    >
      {text}
    </span>
  );
};

/** Version 1 hook: a relatable question popping in word by word, with optional profile chips. */
export const HookScene: React.FC = () => {
  const { hook } = useEpisode();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(T.hook, fps);
  const words = [...hook.line1, ...hook.line2];
  // each popping word has 0.12em margin on both sides
  const size = fitSize([hook.line1.join(" "), hook.line2.join(" ")], 132, 940, (l) => l.split(" ").length * 0.24);
  const sub = pop(frame, fps, words.length * WORD_GAP + 8);
  const zoom = interpolate(frame, [0, duration], [1, 1.06]);
  const out = exitOut(frame, duration, 5);
  const chips = hook.chips ?? [];
  const highlightIndex = words.indexOf(hook.highlight);

  const sounds: SoundCue[] = words.map((w, i) =>
    i === highlightIndex
      ? { file: "audio/scratch.wav", at: (i * WORD_GAP) / fps, volume: 0.9 }
      : { file: "audio/pop.wav", at: (i * WORD_GAP) / fps },
  );

  return (
    <AbsoluteFill>
      {/* Static grid so the last frame of the CTA matches this first frame (seamless loop) */}
      <GridBackground glow drift={false} />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, opacity: out }}>
        <div
          style={{
            position: "absolute",
            top: chips.length ? 420 : 600,
            left: 60,
            right: 60,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: size,
            lineHeight: 1.12,
            letterSpacing: -3,
          }}
        >
          <div>
            {hook.line1.map((w, i) => (
              <Word key={w + i} text={w} index={i} highlight={w === hook.highlight} />
            ))}
          </div>
          <div>
            {hook.line2.map((w, i) => (
              <Word key={w + i} text={w} index={hook.line1.length + i} highlight={w === hook.highlight} />
            ))}
          </div>
          <div
            style={{
              marginTop: 40,
              fontFamily: theme.font.body,
              fontWeight: 700,
              fontSize: 50,
              letterSpacing: 0,
              color: theme.color.body,
              opacity: sub,
              transform: `translateY(${(1 - sub) * 24}px)`,
            }}
          >
            {hook.subline}
          </div>
        </div>

        {chips.length ? (
          <div
            style={{
              position: "absolute",
              top: 1010,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 26,
            }}
          >
            {chips.map((chip, i) => {
              const p = pop(frame, fps, 30 + i * 5);
              const wobble = frame > 50 ? Math.sin(frame * 0.9 + i * 2) * 3.5 : 0;
              return (
                <div
                  key={chip}
                  style={{
                    padding: "22px 54px",
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.color.pinkBg,
                    border: `3px solid ${theme.color.pinkBorder}`,
                    color: theme.color.crimson,
                    fontFamily: theme.font.heading,
                    fontWeight: 800,
                    fontSize: 54,
                    boxShadow: theme.shadow.soft,
                    opacity: p,
                    transform: `translateX(${(1 - p) * (i % 2 ? 300 : -300) + float(frame, 6, 0.15, i)}px) rotate(${wobble + (i - 1) * 2}deg)`,
                  }}
                >
                  {chip}
                </div>
              );
            })}
          </div>
        ) : null}
      </AbsoluteFill>
      <Sounds cues={sounds} />
    </AbsoluteFill>
  );
};
