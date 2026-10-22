import React from "react";
import { AbsoluteFill, Audio, Series, staticFile, useVideoConfig } from "remotion";
import { sec } from "./anim";
import { SafeZones } from "./components/SafeZones";
import { Watermark } from "./components/Watermark";
import { scenesFor, type Episode } from "./episode";
import { EpisodeProvider } from "./EpisodeContext";
import { loadFonts } from "./fonts";
import { BuildScene } from "./scenes/BuildScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { CtaScene } from "./scenes/CtaScene";
import { HookScene } from "./scenes/HookScene";
import { MythsScene } from "./scenes/MythsScene";
import { ProofScene } from "./scenes/ProofScene";
import { AnswerScene, QuestionScene, WhyScene } from "./scenes/QuizScene";
import { RevealScene } from "./scenes/RevealScene";
import { TipsScene } from "./scenes/TipsScene";
import { MUSIC, SHOW_SAFE_ZONES, WATERMARK } from "./settings";

loadFonts();

const COMPONENTS: Record<string, React.FC> = {
  hook: HookScene,
  build: BuildScene,
  reveal: RevealScene,
  proof: ProofScene,
  tips: TipsScene,
  myths: MythsScene,
  question: QuestionScene,
  answer: AnswerScene,
  why: WhyScene,
  closing: ClosingScene,
  cta: CtaScene,
};

export type ShortProps = { episode: Episode };

export const Short: React.FC<ShortProps> = ({ episode }) => {
  const { fps } = useVideoConfig();
  const spans = scenesFor(episode);

  let cursor = 0;
  const watermarkRanges: [number, number][] = [];
  for (const s of spans) {
    const len = sec(s.seconds, fps);
    if (!WATERMARK.hiddenIn.includes(s.name)) watermarkRanges.push([cursor, cursor + len]);
    cursor += len;
  }

  return (
    <EpisodeProvider episode={episode}>
      <AbsoluteFill style={{ backgroundColor: "white" }}>
        <Series>
          {spans.map((s) => {
            const Scene = COMPONENTS[s.name];
            return (
              <Series.Sequence key={s.name} name={s.name} durationInFrames={sec(s.seconds, fps)}>
                <Scene />
              </Series.Sequence>
            );
          })}
        </Series>
        <Watermark visibleRanges={watermarkRanges} />
        <Audio src={staticFile(MUSIC.file)} volume={MUSIC.volume} />
        {SHOW_SAFE_ZONES ? <SafeZones /> : null}
      </AbsoluteFill>
    </EpisodeProvider>
  );
};
