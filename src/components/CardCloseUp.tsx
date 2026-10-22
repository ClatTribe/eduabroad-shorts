import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { float, glide, pop } from "../anim";
import type { CardShot } from "../cards";
import { PRIVACY_BLUR } from "../settings";
import { theme } from "../theme";

const SHOT_W = 798;
const SHOT_H = 1380;

/**
 * A real admit card from the portal, zoomed in, with crimson highlight rings
 * and (optionally) the undergrad college line blurred for privacy.
 */
export const CardCloseUp: React.FC<{
  card: CardShot;
  top: number;
  durationInFrames: number;
  /** Frame the first highlight ring appears. */
  highlightStart?: number;
  highlightGap?: number;
  /** Make the last highlight land like a rubber stamp. */
  stampLast?: boolean;
  enter?: "glide" | "slam";
}> = ({ card, top, durationInFrames, highlightStart = 8, highlightGap = 8, stampLast = false, enter = "glide" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { crop } = card;
  const width = 940;
  const scale = width / crop.w;
  const g = enter === "slam" ? pop(frame, fps, 0, 320) : glide(frame, fps, 0);
  const kenBurns = interpolate(frame, [0, durationInFrames], [1, 1.05]);
  const enterScale = enter === "slam" ? 1.35 - g * 0.35 : 0.9 + g * 0.1;
  const enterY = enter === "slam" ? 0 : (1 - g) * 300;

  const shot = (extra?: React.CSSProperties) => (
    <Img
      src={staticFile(card.image)}
      style={{
        position: "absolute",
        left: -crop.x * scale,
        top: -crop.y * scale,
        width: SHOT_W * scale,
        height: SHOT_H * scale,
        ...extra,
      }}
    />
  );

  const p = card.privateLine;

  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - width) / 2,
        top: top + enterY,
        width,
        height: crop.h * scale,
        borderRadius: theme.radius.card,
        overflow: "hidden",
        boxShadow: theme.shadow.card,
        opacity: Math.min(1, g * 1.5),
        transform: `scale(${enterScale * kenBurns}) rotate(${float(frame, 0.4, 0.1)}deg)`,
      }}
    >
      {shot()}

      {PRIVACY_BLUR ? (
        <div
          style={{
            position: "absolute",
            left: (p.x - crop.x) * scale,
            top: (p.y - crop.y) * scale,
            width: p.w * scale,
            height: p.h * scale,
            overflow: "hidden",
            borderRadius: 12,
          }}
        >
          {/* Same screenshot, shifted to line up, then blurred */}
          <div style={{ position: "absolute", left: -(p.x - crop.x) * scale, top: -(p.y - crop.y) * scale }}>
            {shot({ filter: "blur(14px)" })}
          </div>
        </div>
      ) : null}

      {card.highlights.map((b, i) => {
        const isStamp = stampLast && i === card.highlights.length - 1;
        const start = highlightStart + i * highlightGap;
        const h = pop(frame, fps, start, isStamp ? 380 : 260);
        const pulse = 1 + Math.sin((frame - start) * 0.35) * 0.02;
        const ringScale = isStamp ? 2.2 - h * 1.2 : 1.3 - h * 0.3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (b.x - crop.x) * scale - 10,
              top: (b.y - crop.y) * scale - 10,
              width: b.w * scale + 20,
              height: b.h * scale + 20,
              borderRadius: 30,
              border: `7px solid ${theme.color.crimson}`,
              boxShadow: `0 0 0 8px rgba(165,28,48,0.15)`,
              opacity: h,
              transform: `scale(${ringScale * pulse}) rotate(${isStamp ? (1 - h) * -10 : 0}deg)`,
            }}
          />
        );
      })}
    </div>
  );
};
