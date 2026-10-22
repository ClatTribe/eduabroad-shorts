import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { fitSize } from "../text";
import { SAFE, theme } from "../theme";

/**
 * Big two-line caption pinned just below the YouTube top safe line.
 * Line 1 is dark ink, line 2 uses the crimson headline gradient.
 */
export const Caption: React.FC<{
  line1: string;
  line2?: string;
  delay?: number;
  size?: number;
  onDark?: boolean;
}> = ({ line1, line2, delay = 0, size = 76, onDark = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(frame, fps, delay);
  const b = pop(frame, fps, delay + 5);
  return (
    <div
      style={{
        position: "absolute",
        top: SAFE.top + 40,
        left: 150,
        right: 150,
        textAlign: "center",
        fontFamily: theme.font.heading,
        lineHeight: 1.08,
      }}
    >
      <div
        style={{
          fontSize: size,
          fontWeight: 900,
          color: onDark ? theme.color.white : theme.color.ink,
          letterSpacing: -1.5,
          opacity: a,
          transform: `translateY(${(1 - a) * 40}px) scale(${0.85 + a * 0.15})`,
        }}
      >
        {line1}
      </div>
      {line2 ? (
        <div
          style={{
            marginTop: 14,
            // one line only, shrunk to fit, so captions never run into the footage below
            fontSize: Math.min(size * 0.72, fitSize([line2 ?? ""], 60, 760)),
            whiteSpace: "nowrap",
            fontWeight: 800,
            color: onDark ? theme.color.pinkBorder : undefined,
            backgroundImage: onDark ? undefined : theme.gradient.headlineText,
            WebkitBackgroundClip: onDark ? undefined : "text",
            WebkitTextFillColor: onDark ? undefined : "transparent",
            opacity: b,
            transform: `translateY(${(1 - b) * 30}px)`,
          }}
        >
          {line2}
        </div>
      ) : null}
    </div>
  );
};
