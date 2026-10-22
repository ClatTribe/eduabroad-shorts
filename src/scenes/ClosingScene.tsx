import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { exitOut, float, pop, sec } from "../anim";
import { GridBackground } from "../components/GridBackground";
import { Sounds } from "../components/Sounds";
import { T } from "../episode";
import { useEpisode } from "../EpisodeContext";
import { fitSize } from "../text";
import { theme } from "../theme";

/** Two-line takeaway before the CTA (used by Seedhi Baat and Myth vs Fact). */
export const ClosingScene: React.FC = () => {
  const { closing } = useEpisode();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c1 = pop(frame, fps, 0);
  const c2 = pop(frame, fps, 10, 260);
  const out = exitOut(frame, sec(T.closing, fps), 5);
  return (
    <AbsoluteFill>
      <GridBackground glow />
      <AbsoluteFill style={{ opacity: out }}>
        <div
          style={{
            position: "absolute",
            top: 680,
            left: 40,
            right: 40,
            textAlign: "center",
            fontFamily: theme.font.heading,
            letterSpacing: -2,
            transform: `translateY(${float(frame, 5, 0.1)}px)`,
          }}
        >
          <div
            style={{
              fontSize: fitSize([closing.line1], 80, 1000),
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
              marginTop: 14,
              fontSize: fitSize([closing.line2], 120, 1000),
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
      <Sounds
        cues={[
          { file: "audio/pop.wav", at: 0 },
          { file: "audio/pop.wav", at: 0.33 },
        ]}
      />
    </AbsoluteFill>
  );
};
