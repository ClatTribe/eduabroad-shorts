import React from "react";
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { glide } from "../anim";
import { theme } from "../theme";

// Portal screen recording is 798 x 1380 after cropping.
const SRC_W = 798;
const SRC_H = 1380;

/** Real portal footage in a rounded "phone screen" card that slides up. */
export const FootagePanel: React.FC<{
  video: string;
  playbackRate?: number;
  trimStartFrames?: number;
  width?: number;
  top?: number;
}> = ({ video, playbackRate = 1, trimStartFrames = 0, width = 820, top = 560 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = glide(frame, fps, 0);
  const height = (width / SRC_W) * SRC_H;
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - width) / 2,
        top: top + (1 - g) * 500,
        width,
        height,
        borderRadius: 48,
        overflow: "hidden",
        border: `6px solid ${theme.color.white}`,
        boxShadow: `${theme.shadow.card}, 0 0 0 3px ${theme.color.pinkBorder}`,
        transform: `rotate(${(1 - g) * 4}deg) scale(${0.94 + g * 0.06})`,
        backgroundColor: theme.color.white,
      }}
    >
      <OffthreadVideo
        src={staticFile(video)}
        playbackRate={playbackRate}
        trimBefore={trimStartFrames}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};
