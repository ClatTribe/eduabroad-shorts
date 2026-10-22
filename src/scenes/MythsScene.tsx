import React from "react";
import { AbsoluteFill, interpolate, Series, useCurrentFrame, useVideoConfig } from "remotion";
import { exitOut, float, pop, sec } from "../anim";
import { GridBackground } from "../components/GridBackground";
import { SeriesCard } from "../components/SeriesCard";
import { Sounds, type SoundCue } from "../components/Sounds";
import { T } from "../episode";
import { useEpisode } from "../EpisodeContext";
import { fitSize } from "../text";
import { SAFE, theme } from "../theme";
import { Check } from "./ProofScene";

/** The myth: a quoted statement that gets stamped "MYTH" and crossed out. */
const MythCard: React.FC<{ myth: string }> = ({ myth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(T.myth, fps);
  const card = pop(frame, fps, 0);
  const stamp = pop(frame, fps, 12, 380);
  const strike = interpolate(frame, [26, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = exitOut(frame, duration, 4);
  const shake = frame >= 12 && frame < 20 ? Math.sin(frame * 3.4) * 8 : 0;
  const size = fitSize([myth.slice(0, Math.ceil(myth.length / 2.4))], 78, 780);

  return (
    <AbsoluteFill>
      <GridBackground tint={theme.color.pinkBg} />
      <AbsoluteFill style={{ opacity: out, transform: `translateX(${shake}px)` }}>
        <div
          style={{
            position: "absolute",
            top: SAFE.top + 40,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: 56,
            color: theme.color.body,
            opacity: card,
          }}
        >
          Log kehte hain...
        </div>
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 80,
            right: 80,
            padding: "70px 60px",
            borderRadius: theme.radius.card,
            backgroundColor: theme.color.white,
            border: `4px solid ${theme.color.pinkBorder}`,
            boxShadow: theme.shadow.card,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: size,
            lineHeight: 1.15,
            color: theme.color.ink,
            opacity: card,
            transform: `translateY(${(1 - card) * 200}px) rotate(${(1 - card) * 5}deg)`,
          }}
        >
          {/* line-through works across wrapped lines; it fades in after the stamp */}
          <span
            style={{
              textDecorationLine: "line-through",
              textDecorationThickness: 9,
              textDecorationColor: `rgba(165, 28, 48, ${strike * 0.85})`,
            }}
          >
            “{myth}”
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            top: 430,
            right: 90,
            padding: "14px 44px",
            border: `10px solid ${theme.color.crimson}`,
            borderRadius: 24,
            color: theme.color.crimson,
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: 96,
            letterSpacing: 4,
            backgroundColor: "rgba(255,255,255,0.9)",
            opacity: stamp,
            transform: `scale(${2.4 - stamp * 1.4}) rotate(-10deg)`,
          }}
        >
          MYTH
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** The fact: a "FACT" pill, the short answer, and a one-line explanation. */
const FactCard: React.FC<{ fact: string; detail: string }> = ({ fact, detail }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(T.fact, fps);
  const pill = pop(frame, fps, 0, 260);
  const f = pop(frame, fps, 6, 220);
  const d = pop(frame, fps, 18);
  const flip = interpolate(frame, [0, 10], [90, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = exitOut(frame, duration, 5);
  const factSize = fitSize([fact.slice(0, Math.ceil(fact.length / 2))], 88, 900);

  return (
    <AbsoluteFill>
      <GridBackground glow />
      <AbsoluteFill style={{ opacity: out, transform: `perspective(1600px) rotateY(${flip}deg)` }}>
        <div
          style={{
            position: "absolute",
            top: SAFE.top + 60,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "20px 54px 20px 30px",
              borderRadius: theme.radius.pill,
              background: theme.gradient.button,
              boxShadow: theme.shadow.crimsonButton,
              color: theme.color.white,
              fontFamily: theme.font.heading,
              fontWeight: 900,
              fontSize: 72,
              letterSpacing: 3,
              opacity: pill,
              transform: `scale(${0.4 + pill * 0.6})`,
            }}
          >
            <Check size={72} />
            FACT
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 70,
            right: 70,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: factSize,
            lineHeight: 1.1,
            letterSpacing: -2,
            color: theme.color.ink,
            opacity: f,
            transform: `translateY(${(1 - f) * 50}px)`,
          }}
        >
          {fact}
        </div>
        <div
          style={{
            position: "absolute",
            top: 980,
            left: 80,
            right: 80,
            padding: "44px 50px",
            borderRadius: theme.radius.card,
            backgroundColor: theme.color.white,
            border: `4px solid ${theme.color.pinkBorder}`,
            boxShadow: theme.shadow.card,
            fontFamily: theme.font.body,
            fontWeight: 700,
            fontSize: detail.length > 80 ? 44 : 50,
            lineHeight: 1.3,
            color: theme.color.body,
            textAlign: "center",
            opacity: d,
            transform: `translateY(${(1 - d) * 120 + float(frame, 4, 0.12)}px)`,
          }}
        >
          {detail}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const MythsScene: React.FC = () => {
  const { myths } = useEpisode();
  const { fps } = useVideoConfig();
  if (!myths) return null;
  const sounds: SoundCue[] = [{ file: "audio/hit.wav", at: 0, volume: 0.8 }];
  myths.items.forEach((_, i) => {
    const at = T.seriesCard + i * (T.myth + T.fact);
    sounds.push(
      { file: "audio/whoosh.wav", at },
      { file: "audio/scratch.wav", at: at + 0.4, volume: 0.8 },
      { file: "audio/whoosh.wav", at: at + T.myth },
      { file: "audio/ding.wav", at: at + T.myth + 0.1 },
    );
  });
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={sec(T.seriesCard, fps)}>
          <SeriesCard label={myths.seriesLabel} seconds={T.seriesCard} />
        </Series.Sequence>
        {myths.items.flatMap((item, i) => [
          <Series.Sequence key={`m${i}`} durationInFrames={sec(T.myth, fps)}>
            <MythCard myth={item.myth} />
          </Series.Sequence>,
          <Series.Sequence key={`f${i}`} durationInFrames={sec(T.fact, fps)}>
            <FactCard fact={item.fact} detail={item.detail} />
          </Series.Sequence>,
        ])}
      </Series>
      <Sounds cues={sounds} />
    </AbsoluteFill>
  );
};
