import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { exitOut, float, pop, sec } from "../anim";
import { GridBackground } from "../components/GridBackground";
import { Sounds, type SoundCue } from "../components/Sounds";
import { T } from "../episode";
import { useEpisode } from "../EpisodeContext";
import { fitSize } from "../text";
import { theme } from "../theme";

const STAGGER = 30; // one point per second

export const Check: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Version 1 proof: 2 or 3 tick cards, then the closing line. */
export const ProofScene: React.FC = () => {
  const { proof, closing } = useEpisode();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(T.proof, fps);
  const points = proof?.points ?? [];
  const closingStart = points.length * STAGGER + 12;
  const c1 = pop(frame, fps, closingStart);
  const c2 = pop(frame, fps, closingStart + 10, 260);
  const out = exitOut(frame, duration, 5);
  const pointSize = fitSize(
    points.map((p) => p.slice(0, Math.ceil(p.length / 2))),
    54,
    640,
  );

  const sounds: SoundCue[] = [
    ...points.map((_, i) => ({ file: "audio/ding.wav", at: (i * STAGGER + 4) / fps })),
    { file: "audio/pop.wav", at: closingStart / fps },
    { file: "audio/pop.wav", at: (closingStart + 10) / fps },
  ];

  return (
    <AbsoluteFill>
      <GridBackground glow />
      <AbsoluteFill style={{ opacity: out }}>
        <div
          style={{
            position: "absolute",
            top: 330,
            left: 70,
            right: 70,
            display: "flex",
            flexDirection: "column",
            gap: 34,
          }}
        >
          {points.map((point, i) => {
            const p = pop(frame, fps, i * STAGGER + 4);
            return (
              <div
                key={point}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 34,
                  padding: "36px 40px",
                  borderRadius: theme.radius.card,
                  backgroundColor: theme.color.white,
                  border: `4px solid ${theme.color.pinkBorder}`,
                  boxShadow: theme.shadow.card,
                  opacity: p,
                  transform: `translateX(${(1 - p) * 700}px) translateY(${float(frame, 4, 0.12, i)}px)`,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 96,
                    height: 96,
                    borderRadius: theme.radius.pill,
                    background: theme.gradient.button,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: theme.shadow.crimsonButton,
                    transform: `scale(${0.5 + pop(frame, fps, i * STAGGER + 10, 300) * 0.5})`,
                  }}
                >
                  <Check />
                </div>
                <div
                  style={{
                    fontFamily: theme.font.heading,
                    fontWeight: 800,
                    fontSize: pointSize,
                    lineHeight: 1.15,
                    color: theme.color.ink,
                  }}
                >
                  {point}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            top: 1190,
            left: 40,
            right: 40,
            textAlign: "center",
            fontFamily: theme.font.heading,
            letterSpacing: -2,
          }}
        >
          <div
            style={{
              fontSize: fitSize([closing.line1], 76, 1000),
              fontWeight: 800,
              color: theme.color.body,
              opacity: c1,
              transform: `translateY(${(1 - c1) * 40}px)`,
            }}
          >
            {closing.line1}
          </div>
          <div
            style={{
              display: "inline-block",
              fontSize: fitSize([closing.line2], 116, 1000),
              fontWeight: 900,
              backgroundImage: theme.gradient.headlineText,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              paddingBottom: 8,
              opacity: c2,
              transform: `scale(${0.6 + c2 * 0.4})`,
            }}
          >
            {closing.line2}
          </div>
        </div>
      </AbsoluteFill>
      <Sounds cues={sounds} />
    </AbsoluteFill>
  );
};
