import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { float, pop, sec } from "../anim";
import { GridBackground } from "../components/GridBackground";
import { Sounds } from "../components/Sounds";
import { T } from "../episode";
import { useEpisode } from "../EpisodeContext";
import { fitSize } from "../text";
import { theme } from "../theme";

const LOOP_OUT = 0.4; // seconds: clear back to the hook's empty background for a seamless replay

export const CtaScene: React.FC = () => {
  const { cta } = useEpisode();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(T.cta, fps);
  const logo = pop(frame, fps, 0, 180);
  const button = pop(frame, fps, 14, 240);
  const url = pop(frame, fps, 22);
  const pulse = frame > 30 ? 1 + Math.sin((frame - 30) * 0.3) * 0.035 : 1;
  const sheen = interpolate(frame, [36, 60], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const loopOut = interpolate(frame, [duration - sec(LOOP_OUT, fps), duration - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <GridBackground glow drift={false} />
      <AbsoluteFill style={{ opacity: 1 - loopOut, transform: `scale(${1 - loopOut * 0.08})` }}>
        {/* Logo exactly as provided (edulogo.png, with "HAI NA!") */}
        <Img
          src={staticFile("brand/edulogo.png")}
          style={{
            position: "absolute",
            top: 400 + float(frame, 5, 0.1),
            left: 100,
            width: 880,
            opacity: logo,
            transform: `scale(${0.7 + logo * 0.3}) translateY(${(1 - logo) * 80}px)`,
          }}
        />
        <div style={{ position: "absolute", top: 860, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "38px 96px",
              borderRadius: theme.radius.pill,
              background: theme.gradient.button,
              color: theme.color.white,
              fontFamily: theme.font.heading,
              fontWeight: 900,
              fontSize: fitSize([cta.button + " →"], 84, 760),
              letterSpacing: -1,
              boxShadow: theme.shadow.crimsonButton,
              opacity: button,
              transform: `scale(${(0.5 + button * 0.5) * pulse})`,
            }}
          >
            {cta.button}
            <span style={{ marginLeft: 24 }}>→</span>
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${sheen}%`,
                width: 120,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                transform: "skewX(-20deg)",
              }}
            />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 1150,
            left: 40,
            right: 40,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: fitSize([cta.url], 76, 960, (l) => l.length * 0.05),
            whiteSpace: "nowrap",
            color: theme.color.ink,
            letterSpacing: -1,
            opacity: url,
            transform: `translateY(${(1 - url) * 40}px)`,
          }}
        >
          {cta.url}
        </div>
      </AbsoluteFill>
      <Sounds
        cues={[
          { file: "audio/hit.wav", at: 0 },
          { file: "audio/pop.wav", at: 0.5 },
        ]}
      />
    </AbsoluteFill>
  );
};
