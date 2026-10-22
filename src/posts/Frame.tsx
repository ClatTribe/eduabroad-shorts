import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { theme } from "../theme";

export const W = 1080;
export const H = 1350;
export const PAD = 80;
/** Content area between header and footer */
export const TOP = 190;
export const BOTTOM = 1230;

type Tone = "light" | "pink" | "crimson";

/** Grid paper background, same as the Shorts. */
const Background: React.FC<{ tone: Tone }> = ({ tone }) => {
  if (tone === "crimson") return <AbsoluteFill style={{ background: theme.gradient.darkPanel }} />;
  return (
    <AbsoluteFill style={{ backgroundColor: tone === "pink" ? theme.color.pinkBg : theme.color.white }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(to right, ${theme.color.gridLine} 2px, transparent 2px), linear-gradient(to bottom, ${theme.color.gridLine} 2px, transparent 2px)`,
          backgroundSize: "120px 120px",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% 45%, rgba(165,28,48,0.07), transparent 70%)" }}
      />
    </AbsoluteFill>
  );
};

/**
 * Every post slide: logo + series pill on top, website + swipe dots at the bottom.
 * On crimson slides the logo sits on a white chip so its black "Edu" stays readable.
 */
export const Frame: React.FC<{
  series: string;
  index: number;
  total: number;
  tone?: Tone;
  children: React.ReactNode;
}> = ({ series, index, total, tone = "light", children }) => {
  const onDark = tone === "crimson";
  const muted = onDark ? "rgba(255,255,255,0.75)" : theme.color.muted;
  const isLast = index === total - 1;
  return (
    <AbsoluteFill style={{ fontFamily: theme.font.body }}>
      <Background tone={tone} />
      {/* header */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: PAD,
          right: PAD,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            padding: onDark ? "12px 18px" : 0,
            borderRadius: 18,
            backgroundColor: onDark ? theme.color.white : "transparent",
            display: "flex",
          }}
        >
          <Img src={staticFile("brand/edulogo-clean.png")} style={{ height: onDark ? 54 : 66, display: "block" }} />
        </div>
        <div
          style={{
            padding: "12px 26px",
            borderRadius: theme.radius.pill,
            border: `2.5px solid ${onDark ? "rgba(255,255,255,0.5)" : theme.color.pinkBorder}`,
            backgroundColor: onDark ? "rgba(255,255,255,0.08)" : theme.color.white,
            color: onDark ? theme.color.white : theme.color.crimson,
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 2.5,
            textTransform: "uppercase",
          }}
        >
          {series}
        </div>
      </div>

      {children}

      {/* footer */}
      <div
        style={{
          position: "absolute",
          bottom: 52,
          left: PAD,
          right: PAD,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: theme.font.heading,
          fontWeight: 700,
          fontSize: 26,
          color: muted,
        }}
      >
        <span>app.goeduabroad.com</span>
        {total > 1 ? (
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === index ? 34 : 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor:
                    i === index
                      ? onDark
                        ? theme.color.white
                        : theme.color.crimson
                      : onDark
                        ? "rgba(255,255,255,0.35)"
                        : theme.color.pinkBorder,
                }}
              />
            ))}
            {!isLast ? (
              <span style={{ marginLeft: 10, color: onDark ? theme.color.white : theme.color.crimson }}>Swipe →</span>
            ) : null}
          </span>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** Big two-tone headline: ink line + crimson gradient line. */
export const Headline: React.FC<{
  line1: string;
  line2?: string;
  size: number;
  size2?: number;
  onDark?: boolean;
  align?: "left" | "center";
}> = ({ line1, line2, size, size2, onDark, align = "left" }) => (
  <div
    style={{ fontFamily: theme.font.heading, fontWeight: 900, letterSpacing: -2, lineHeight: 1.04, textAlign: align }}
  >
    <div style={{ fontSize: size, color: onDark ? theme.color.white : theme.color.ink }}>{line1}</div>
    {line2 ? (
      <div
        style={{
          display: "inline-block",
          fontSize: size2 ?? size,
          paddingBottom: 6,
          ...(onDark
            ? { color: theme.color.pinkBorder }
            : {
                backgroundImage: theme.gradient.headlineText,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }),
        }}
      >
        {line2}
      </div>
    ) : null}
  </div>
);

export const CheckDot: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <div
    style={{
      flexShrink: 0,
      width: size,
      height: size,
      borderRadius: 999,
      background: theme.gradient.button,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: theme.shadow.crimsonButton,
    }}
  >
    <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      backgroundColor: theme.color.white,
      border: `3px solid ${theme.color.pinkBorder}`,
      borderRadius: 36,
      boxShadow: theme.shadow.card,
      ...style,
    }}
  >
    {children}
  </div>
);
