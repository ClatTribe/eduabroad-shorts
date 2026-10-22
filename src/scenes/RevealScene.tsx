import React from "react";
import { AbsoluteFill, Img, interpolate, Series, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { exitOut, pop, sec } from "../anim";
import { CARDS, type CardShot } from "../cards";
import { Caption } from "../components/Caption";
import { CardCloseUp } from "../components/CardCloseUp";
import { FootagePanel } from "../components/FootagePanel";
import { GridBackground } from "../components/GridBackground";
import { Sounds, type SoundCue } from "../components/Sounds";
import { T, type Clip } from "../episode";
import { useEpisode } from "../EpisodeContext";
import { fitSize } from "../text";
import { theme } from "../theme";

/** Crimson stinger: kicker + headline + logo + feature pill. */
const Intro: React.FC<{ kicker: string; headline: string; featurePill: string }> = ({
  kicker,
  headline,
  featurePill,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(T.revealIntro, fps);
  const k = pop(frame, fps, 0);
  const h = pop(frame, fps, 4, 240);
  const logo = pop(frame, fps, 8);
  const pill = pop(frame, fps, 14, 260);
  const out = exitOut(frame, duration, 4);
  return (
    <AbsoluteFill style={{ background: theme.gradient.darkPanel }}>
      <AbsoluteFill style={{ opacity: out, transform: `scale(${interpolate(frame, [0, duration], [1, 1.05])})` }}>
        <div
          style={{
            position: "absolute",
            top: 330,
            left: 60,
            right: 60,
            textAlign: "center",
            fontFamily: theme.font.heading,
          }}
        >
          <div
            style={{
              fontSize: fitSize([kicker], 70),
              fontWeight: 800,
              color: theme.color.pinkBorder,
              opacity: k,
              transform: `translateY(${(1 - k) * 30}px)`,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              fontSize: fitSize([headline], 128),
              fontWeight: 900,
              color: theme.color.white,
              letterSpacing: -3,
              opacity: h,
              transform: `scale(${0.6 + h * 0.4})`,
            }}
          >
            {headline}
          </div>
        </div>
        {/* Logo sits on a white card so its black "Edu" stays readable (never recolored). */}
        <div
          style={{
            position: "absolute",
            top: 820,
            left: 110,
            right: 110,
            padding: "46px 50px",
            borderRadius: theme.radius.card,
            backgroundColor: theme.color.white,
            boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
            opacity: logo,
            transform: `translateY(${(1 - logo) * 120}px) rotate(${(1 - logo) * -6}deg)`,
          }}
        >
          <Img src={staticFile("brand/edulogo-clean.png")} style={{ width: "100%", display: "block" }} />
        </div>
        <div style={{ position: "absolute", top: 1180, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              padding: "24px 64px",
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.white,
              color: theme.color.crimson,
              fontFamily: theme.font.heading,
              fontWeight: 900,
              fontSize: fitSize([featurePill], 64, 820),
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              opacity: pill,
              transform: `scale(${0.4 + pill * 0.6})`,
            }}
          >
            {featurePill}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const captionSize = (caption: string) => fitSize([caption.slice(0, Math.ceil(caption.length / 1.6))], 74, 780);

const ClipBeat: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = sec(clip.seconds, fps);
  const out = exitOut(frame, duration, 4);
  const card: CardShot | undefined =
    clip.kind === "card" ? (typeof clip.card === "string" ? CARDS[clip.card] : clip.card) : undefined;
  return (
    <AbsoluteFill>
      <GridBackground tint={theme.color.pinkBg} />
      <AbsoluteFill style={{ opacity: out }}>
        {clip.kind === "video" ? (
          <FootagePanel
            video={clip.src}
            playbackRate={clip.playbackRate ?? 1}
            trimStartFrames={sec(clip.trimStartSeconds ?? 0, fps)}
          />
        ) : card ? (
          <CardCloseUp card={card} top={card.crop.h > 650 ? 560 : 640} durationInFrames={duration} />
        ) : null}
        <Caption line1={clip.caption} line2={clip.subcaption} size={captionSize(clip.caption)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const RevealScene: React.FC = () => {
  const { reveal } = useEpisode();
  const { fps } = useVideoConfig();
  if (!reveal) return null;

  const sounds: SoundCue[] = [{ file: "audio/hit.wav", at: 0, volume: 0.9 }];
  let t = T.revealIntro;
  for (const clip of reveal.clips) {
    sounds.push({ file: "audio/whoosh.wav", at: t });
    if (clip.kind === "video") sounds.push({ file: "audio/typing.wav", at: t + 0.3, volume: 0.5 });
    if (clip.kind === "card") {
      const card = typeof clip.card === "string" ? CARDS[clip.card] : clip.card;
      (card?.highlights ?? []).forEach((_, i) => sounds.push({ file: "audio/ding.wav", at: t + (8 + i * 8) / 30 }));
    }
    t += clip.seconds;
  }

  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={sec(T.revealIntro, fps)}>
          <Intro kicker={reveal.kicker} headline={reveal.headline} featurePill={reveal.featurePill} />
        </Series.Sequence>
        {reveal.clips.map((clip, i) => (
          <Series.Sequence key={i} durationInFrames={sec(clip.seconds, fps)}>
            <ClipBeat clip={clip} />
          </Series.Sequence>
        ))}
      </Series>
      <Sounds cues={sounds} />
    </AbsoluteFill>
  );
};
