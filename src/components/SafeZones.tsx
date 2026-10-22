import React from "react";
import { AbsoluteFill } from "remotion";
import { SAFE } from "../theme";

/** Preview-only overlay showing where YouTube's buttons and title sit. */
export const SafeZones: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{ position: "absolute", top: 0, left: 0, right: 0, height: SAFE.top, background: "rgba(255,0,0,0.25)" }}
    />
    <div
      style={{ position: "absolute", top: SAFE.bottom, left: 0, right: 0, bottom: 0, background: "rgba(255,0,0,0.25)" }}
    />
  </AbsoluteFill>
);
