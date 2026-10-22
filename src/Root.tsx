import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import sample from "../episodes/2026-11-04.json";
import { sec } from "./anim";
import { totalSeconds, type Episode } from "./episode";
import { Short, type ShortProps } from "./Short";

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<ShortProps> = ({ props }) => ({
  durationInFrames: sec(totalSeconds(props.episode), FPS),
});

/**
 * Render any episode with:
 *   npx remotion render src/index.ts Short out/<date>.mp4 --props=episodes/<date>.json
 * (the props file is the episode itself, wrapped as { "episode": ... } by tools/render.sh)
 */
export const RemotionRoot: React.FC = () => (
  <Composition
    id="Short"
    component={Short}
    durationInFrames={sec(30, FPS)}
    fps={FPS}
    width={1080}
    height={1920}
    defaultProps={{ episode: sample as Episode }}
    calculateMetadata={calculateMetadata}
  />
);
