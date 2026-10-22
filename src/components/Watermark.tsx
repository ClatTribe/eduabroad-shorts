import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { WATERMARK } from "../settings";
import { SAFE, theme } from "../theme";

/** Small square EduAbroad icon in the top-right, just under YouTube's top UI. */
export const Watermark: React.FC<{ visibleRanges: [number, number][] }> = ({ visibleRanges }) => {
  const frame = useCurrentFrame();
  const opacity = Math.max(
    ...visibleRanges.map(([start, end]) =>
      interpolate(frame, [start, start + 8, end - 8, end], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
    0,
  );
  return (
    <Img
      src={staticFile(WATERMARK.file)}
      style={{
        position: "absolute",
        top: SAFE.top + 12,
        right: 44,
        width: 92,
        height: 92,
        borderRadius: 22,
        border: `4px solid ${theme.color.white}`,
        boxShadow: theme.shadow.soft,
        opacity: opacity * WATERMARK.opacity,
      }}
    />
  );
};
