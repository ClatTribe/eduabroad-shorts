import React from "react";
import { AbsoluteFill, interpolate, Series, useCurrentFrame, useVideoConfig } from "remotion";
import { exitOut, float, pop, sec } from "../anim";
import { GridBackground } from "../components/GridBackground";
import { Sounds, type SoundCue } from "../components/Sounds";
import { T } from "../episode";
import { useEpisode } from "../EpisodeContext";
import { fitSize } from "../text";
import { theme } from "../theme";

/** One "opinion" cut: speaker pill + big chat bubble (+ browser tabs when the speaker is Google). */
const OpinionBeat: React.FC<{ speaker: string; line: string; index: number; tabs?: string[] }> = ({
  speaker,
  line,
  index,
  tabs,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(T.beat, fps);
  const fromLeft = index % 2 === 0;
  const pill = pop(frame, fps, 0);
  const bubble = pop(frame, fps, 4, 170);
  const punch = interpolate(frame, [0, duration], [1.0, 1.08]);
  const out = exitOut(frame, duration, 5);
  // Bubble text wraps; size so roughly 3 lines fit
  const size = Math.min(72, fitSize([line.slice(0, Math.ceil(line.length / 2.4))], 72, 760));

  return (
    <AbsoluteFill>
      <GridBackground tint={index === 1 ? theme.color.pinkBg : theme.color.white} />
      <AbsoluteFill style={{ transform: `scale(${punch})`, opacity: out }}>
        {tabs ? (
          <div
            style={{
              position: "absolute",
              top: 330,
              left: 60,
              right: 170,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              justifyContent: "center",
            }}
          >
            {tabs.map((t, i) => {
              const p = pop(frame, fps, i * 5, 260);
              return (
                <div
                  key={t}
                  style={{
                    padding: "16px 28px",
                    borderRadius: "22px 22px 6px 6px",
                    backgroundColor: theme.color.white,
                    border: `3px solid ${theme.color.pinkBorder}`,
                    fontFamily: theme.font.body,
                    fontWeight: 700,
                    fontSize: 34,
                    color: theme.color.muted,
                    boxShadow: theme.shadow.soft,
                    opacity: p,
                    transform: `scale(${0.5 + p * 0.5}) rotate(${Math.sin(frame * 0.7 + i) * 2.5}deg)`,
                  }}
                >
                  {t}
                </div>
              );
            })}
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            top: tabs ? 760 : 640,
            left: 80,
            right: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: fromLeft ? "flex-start" : "flex-end",
          }}
        >
          <div
            style={{
              padding: "18px 46px",
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.ink,
              color: theme.color.white,
              fontFamily: theme.font.heading,
              fontWeight: 800,
              fontSize: 46,
              marginBottom: 28,
              opacity: pill,
              transform: `translateX(${(1 - pill) * (fromLeft ? -200 : 200)}px)`,
            }}
          >
            {speaker}
          </div>
          <div
            style={{
              maxWidth: 880,
              padding: "52px 60px",
              borderRadius: fromLeft ? "16px 56px 56px 56px" : "56px 16px 56px 56px",
              backgroundColor: theme.color.white,
              border: `4px solid ${theme.color.pinkBorder}`,
              boxShadow: theme.shadow.card,
              fontFamily: theme.font.heading,
              fontWeight: 800,
              fontSize: size,
              lineHeight: 1.15,
              color: theme.color.ink,
              textAlign: fromLeft ? "left" : "right",
              opacity: bubble,
              transform: `translateX(${(1 - bubble) * (fromLeft ? -500 : 500)}px) rotate(${(1 - bubble) * (fromLeft ? -8 : 8) + float(frame, 0.8, 0.2)}deg)`,
            }}
          >
            {line}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** "Opinions bahut hain. Proof kahan hai?" with a drawn underline, then a crimson wipe. */
const Punchline: React.FC<{ line1: string; line2: string }> = ({ line1, line2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(T.punchline, fps);
  const a = pop(frame, fps, 0);
  const b = pop(frame, fps, 14, 240);
  const underline = interpolate(frame, [26, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wipe = interpolate(frame, [duration - 10, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shake = frame > 14 && frame < 24 ? Math.sin(frame * 3) * 6 : 0;
  const size2 = fitSize([line2], 98, 1000);

  return (
    <AbsoluteFill>
      <GridBackground glow />
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 30,
          right: 30,
          textAlign: "center",
          fontFamily: theme.font.heading,
          letterSpacing: -2,
        }}
      >
        <div
          style={{
            fontSize: fitSize([line1], 84, 1000),
            fontWeight: 800,
            color: theme.color.body,
            opacity: a,
            transform: `translateY(${(1 - a) * 40}px)`,
          }}
        >
          {line1}
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 26,
            fontSize: size2,
            fontWeight: 900,
            backgroundImage: theme.gradient.headlineText,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            paddingBottom: 10,
            opacity: b,
            transform: `scale(${0.7 + b * 0.3 + float(frame, 0.01, 0.2)}) translateX(${shake}px)`,
          }}
        >
          {line2}
        </div>
        <div
          style={{
            margin: "6px auto 0",
            height: 16,
            width: Math.min(900, line2.length * size2 * 0.6) * underline,
            borderRadius: 8,
            background: theme.gradient.button,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: `${wipe * 100}%`,
          background: theme.gradient.darkPanel,
        }}
      />
    </AbsoluteFill>
  );
};

export const BuildScene: React.FC = () => {
  const { build } = useEpisode();
  const { fps } = useVideoConfig();
  if (!build) return null;
  const sounds: SoundCue[] = [
    ...build.beats.map((_, i) => ({ file: "audio/whoosh.wav", at: i * T.beat })),
    { file: "audio/whoosh.wav", at: build.beats.length * T.beat },
    { file: "audio/riser.wav", at: build.beats.length * T.beat + T.punchline - 1.5, volume: 0.8 },
  ];
  return (
    <AbsoluteFill>
      <Series>
        {build.beats.map((beat, i) => (
          <Series.Sequence key={i} durationInFrames={sec(T.beat, fps)}>
            <OpinionBeat
              speaker={beat.speaker}
              line={beat.line}
              index={i}
              tabs={beat.speaker.toLowerCase() === "google" ? build.googleTabs : undefined}
            />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={sec(T.punchline, fps)}>
          <Punchline {...build.punchline} />
        </Series.Sequence>
      </Series>
      <Sounds cues={sounds} />
    </AbsoluteFill>
  );
};
