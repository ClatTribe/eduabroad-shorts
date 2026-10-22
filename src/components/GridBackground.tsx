import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

/** The faint square grid from the portal homepage, slowly drifting. */
export const GridBackground: React.FC<{ tint?: string; glow?: boolean; drift?: boolean }> = ({
  tint = theme.color.white,
  glow = false,
  drift = true,
}) => {
  const frame = useCurrentFrame();
  // drift=false keeps the grid fixed, so the loop seam (CTA end -> hook start) matches exactly
  const shift = drift ? (frame * 0.6) % 160 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: tint }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(to right, ${theme.color.gridLine} 3px, transparent 3px), linear-gradient(to bottom, ${theme.color.gridLine} 3px, transparent 3px)`,
          backgroundSize: "160px 160px",
          backgroundPosition: `${shift}px ${shift}px`,
          opacity: 0.9,
        }}
      />
      {glow ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 70% 45% at 50% 55%, rgba(165,28,48,0.10), transparent 70%)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
