import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig } from "remotion";
import { exitOut, float, pop, sec } from "../anim";
import { GridBackground } from "../components/GridBackground";
import { SeriesCard } from "../components/SeriesCard";
import { Sounds, type SoundCue } from "../components/Sounds";
import { T } from "../episode";
import { useEpisode } from "../EpisodeContext";
import { fitSize } from "../text";
import { SAFE, theme } from "../theme";

const TipCard: React.FC<{ index: number; total: number; label: string; title: string; detail: string }> = ({
  index,
  total,
  label,
  title,
  detail,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(T.tip, fps);
  const badge = pop(frame, fps, 0, 260);
  const t = pop(frame, fps, 6, 220);
  const card = pop(frame, fps, 16);
  const out = exitOut(frame, duration, 5);
  const titleSize = fitSize([title.slice(0, Math.ceil(title.length / 2))], 92, 900);

  return (
    <AbsoluteFill>
      <GridBackground tint={index % 2 ? theme.color.pinkBg : theme.color.white} glow={index % 2 === 0} />
      <AbsoluteFill style={{ opacity: out }}>
        {/* series + progress pill */}
        <div
          style={{
            position: "absolute",
            top: SAFE.top + 40,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              padding: "14px 40px",
              borderRadius: theme.radius.pill,
              border: `3px solid ${theme.color.pinkBorder}`,
              backgroundColor: theme.color.white,
              color: theme.color.crimson,
              fontFamily: theme.font.heading,
              fontWeight: 800,
              fontSize: 40,
            }}
          >
            {label} · {index + 1}/{total}
          </div>
        </div>

        {/* number badge */}
        <div style={{ position: "absolute", top: 390, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: theme.radius.pill,
              background: theme.gradient.button,
              boxShadow: theme.shadow.crimsonButton,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.color.white,
              fontFamily: theme.font.heading,
              fontWeight: 900,
              fontSize: 120,
              opacity: badge,
              transform: `scale(${0.3 + badge * 0.7}) rotate(${(1 - badge) * -40}deg)`,
            }}
          >
            {index + 1}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: 650,
            left: 70,
            right: 70,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: titleSize,
            lineHeight: 1.1,
            letterSpacing: -2,
            color: theme.color.ink,
            opacity: t,
            transform: `translateY(${(1 - t) * 50}px)`,
          }}
        >
          {title}
        </div>

        <div
          style={{
            position: "absolute",
            top: 1010,
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
            opacity: card,
            transform: `translateY(${(1 - card) * 120 + float(frame, 4, 0.12)}px)`,
          }}
        >
          {detail}
        </div>

        {/* progress dots */}
        <div
          style={{
            position: "absolute",
            top: 1470,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 18,
          }}
        >
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === index ? 54 : 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: i <= index ? theme.color.crimson : theme.color.pinkBorder,
              }}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TipsScene: React.FC = () => {
  const { tips } = useEpisode();
  const { fps } = useVideoConfig();
  if (!tips) return null;
  const sounds: SoundCue[] = [{ file: "audio/hit.wav", at: 0, volume: 0.8 }];
  tips.items.forEach((_, i) => {
    const at = T.seriesCard + i * T.tip;
    sounds.push({ file: "audio/whoosh.wav", at }, { file: "audio/ding.wav", at: at + 0.15 });
  });
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={sec(T.seriesCard, fps)}>
          <SeriesCard label={tips.seriesLabel} seconds={T.seriesCard} />
        </Series.Sequence>
        {tips.items.map((item, i) => (
          <Series.Sequence key={i} durationInFrames={sec(T.tip, fps)}>
            <TipCard
              index={i}
              total={tips.items.length}
              label={tips.seriesLabel}
              title={item.title}
              detail={item.detail}
            />
          </Series.Sequence>
        ))}
      </Series>
      <Sounds cues={sounds} />
    </AbsoluteFill>
  );
};
