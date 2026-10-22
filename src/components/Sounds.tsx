import React from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { SFX_VOLUME } from "../settings";

/** A sound effect from public/audio/, `at` seconds after the scene starts. */
export type SoundCue = { file: string; at: number; volume?: number };

/** Plays each sound effect at its time (seconds from the start of the scene). */
export const Sounds: React.FC<{ cues: SoundCue[] }> = ({ cues }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {cues.map((cue, i) => (
        <Sequence key={i} from={Math.round(cue.at * fps)} layout="none">
          <Audio src={staticFile(cue.file)} volume={(cue.volume ?? 0.7) * SFX_VOLUME} />
        </Sequence>
      ))}
    </>
  );
};
