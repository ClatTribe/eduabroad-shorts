import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { exitOut, pop, sec } from "../anim";
import { fitSize } from "../text";
import { theme } from "../theme";

/** Short crimson title card that brands a recurring series ("Seedhi Baat", "Myth vs Fact"). */
export const SeriesCard: React.FC<{ label: string; seconds: number }> = ({ label, seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(seconds, fps);
  const a = pop(frame, fps, 0, 240);
  const logo = pop(frame, fps, 8);
  const out = exitOut(frame, duration, 4);
  return (
    <AbsoluteFill style={{ background: theme.gradient.darkPanel }}>
      <AbsoluteFill style={{ opacity: out, transform: `scale(${interpolate(frame, [0, duration], [1, 1.06])})` }}>
        <div
          style={{
            position: "absolute",
            top: 640,
            left: 50,
            right: 50,
            textAlign: "center",
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: fitSize([label], 130, 980),
            letterSpacing: -3,
            color: theme.color.white,
            opacity: a,
            transform: `scale(${0.5 + a * 0.5}) rotate(${(1 - a) * -6}deg)`,
          }}
        >
          {label}
        </div>
        <div
          style={{
            position: "absolute",
            top: 1000,
            left: 250,
            right: 250,
            padding: "28px 34px",
            borderRadius: theme.radius.card,
            backgroundColor: theme.color.white,
            boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            opacity: logo,
            transform: `translateY(${(1 - logo) * 80}px)`,
          }}
        >
          <Img src={staticFile("brand/edulogo-clean.png")} style={{ width: "100%", display: "block" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
