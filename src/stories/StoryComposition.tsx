import React from "react";
import { AbsoluteFill, Freeze, Img, staticFile } from "remotion";
import { loadFonts } from "../fonts";
import { CheckDot, Card } from "../posts/Frame";
import { SERIES_LABEL } from "../posts/post";
import { SketchShort } from "../sketch/SketchShort";
import { fitSize } from "../text";
import { theme } from "../theme";
import { STORY_SAFE, teaserTime, type Story, type StoryContent } from "./story";

loadFonts();

const FPS = 30;
const { top: TOP, bottom: BOTTOM, side: SIDE } = STORY_SAFE;

const Grid: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: theme.color.white }}>
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(to right, ${theme.color.gridLine} 2px, transparent 2px), linear-gradient(to bottom, ${theme.color.gridLine} 2px, transparent 2px)`,
        backgroundSize: "120px 120px",
      }}
    />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 45%, rgba(165,28,48,0.08), transparent 70%)" }} />
  </AbsoluteFill>
);

/** Logo on the left, label pill on the right, just below Instagram's profile bar. */
const Header: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ position: "absolute", top: TOP, left: SIDE, right: SIDE, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <Img src={staticFile("brand/edulogo-clean.png")} style={{ height: 70 }} />
    <div
      style={{
        padding: "14px 30px",
        borderRadius: theme.radius.pill,
        background: theme.gradient.button,
        color: theme.color.white,
        fontFamily: theme.font.heading,
        fontWeight: 900,
        fontSize: 28,
        letterSpacing: 2.5,
        textTransform: "uppercase",
        boxShadow: theme.shadow.crimsonButton,
      }}
    >
      {label}
    </div>
  </div>
);

/** Content block centred between the header and the footer. */
const middle: React.CSSProperties = {
  position: "absolute",
  top: TOP + 110,
  bottom: 1920 - BOTTOM + 90,
  left: SIDE,
  right: SIDE,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const Footer: React.FC<{ text?: string }> = ({ text = "app.goeduabroad.com" }) => (
  <div
    style={{
      position: "absolute",
      top: BOTTOM - 70,
      left: SIDE,
      right: SIDE,
      textAlign: "center",
      fontFamily: theme.font.heading,
      fontWeight: 800,
      fontSize: 38,
      color: theme.color.crimson,
    }}
  >
    {text}
  </div>
);

const Share: React.FC<{ c: Extract<StoryContent, { type: "share" }> }> = ({ c }) => (
  <>
    <Grid />
    <Header label="New post" />
    <div
      style={{
        position: "absolute",
        top: TOP + 130,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: theme.font.body,
        fontWeight: 700,
        fontSize: 40,
        color: theme.color.muted,
      }}
    >
      Today&apos;s post: <span style={{ color: theme.color.ink }}>{SERIES_LABEL[c.postType]}</span>
    </div>
    <Img
      src={staticFile(c.image)}
      style={{
        position: "absolute",
        top: TOP + 220,
        left: 108,
        width: 864,
        height: 1080,
        borderRadius: 36,
        border: `4px solid ${theme.color.pinkBorder}`,
        boxShadow: theme.shadow.card,
      }}
    />
    <Footer text="See the full post on our feed" />
  </>
);

const Tip: React.FC<{ c: Extract<StoryContent, { type: "tip" }> }> = ({ c }) => (
  <>
    <Grid />
    <Header label="Tip of the day" />
    <div style={{ ...middle, gap: 64 }}>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05 }}>
        <div style={{ fontSize: fitSize([c.title], 96, 920), color: theme.color.ink }}>{c.title}</div>
        <div
          style={{
            display: "inline-block",
            fontSize: fitSize([c.highlight], 112, 920),
            paddingBottom: 8,
            backgroundImage: theme.gradient.headlineText,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {c.highlight}
        </div>
      </div>
      <Card style={{ padding: "48px 44px", display: "flex", flexDirection: "column", gap: 38 }}>
        {c.points.map((p) => (
          <div key={p} style={{ display: "flex", gap: 26, alignItems: "flex-start" }}>
            <CheckDot size={64} />
            <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 50, lineHeight: 1.35, color: theme.color.ink, paddingTop: 2 }}>{p}</div>
          </div>
        ))}
      </Card>
    </div>
    <Footer />
  </>
);

const Word: React.FC<{ c: Extract<StoryContent, { type: "word" }> }> = ({ c }) => (
  <>
    <Grid />
    <Header label="Word of the day" />
    <div style={{ ...middle, gap: 52 }}>
      <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 40, color: theme.color.muted }}>For IELTS</div>
      <div
        style={{
          fontFamily: theme.font.heading,
          fontWeight: 900,
          fontSize: fitSize([c.word], 200, 920),
          letterSpacing: -4,
          lineHeight: 0.95,
          paddingBottom: 10,
          backgroundImage: theme.gradient.headlineText,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {c.word}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <span style={{ padding: "10px 24px", borderRadius: 999, backgroundColor: theme.color.ink, color: "white", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 30 }}>
          {c.partOfSpeech}
        </span>
        <span style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 46, color: theme.color.ink }}>{c.meaning}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
        {c.synonyms.map((s) => (
          <span
            key={s}
            style={{
              padding: "18px 34px",
              borderRadius: 999,
              border: `3px solid ${theme.color.pinkBorder}`,
              backgroundColor: "white",
              fontFamily: theme.font.heading,
              fontWeight: 800,
              fontSize: 44,
              color: theme.color.ink,
            }}
          >
            {s}
          </span>
        ))}
      </div>
      <Card style={{ padding: "40px 44px" }}>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 28, letterSpacing: 2.5, color: theme.color.crimson, marginBottom: 12 }}>EXAMPLE</div>
        <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 44, lineHeight: 1.4, color: theme.color.ink, fontStyle: "italic" }}>{c.example}</div>
      </Card>
    </div>
    <Footer />
  </>
);

/** The SAT Short frozen at its question (the "Pause & comment" line hidden), with an answer-time banner. */
const SatTeaser: React.FC<{ c: Extract<StoryContent, { type: "sat" }> }> = ({ c }) => {
  const spec = { ...c.spec, voice: undefined, sfx: [], items: c.spec.items.filter((i) => !(i.kind === "text" && /Pause/.test(i.text))) };
  return (
    <>
      <Freeze frame={Math.round((c.at ?? teaserTime(c.spec)) * FPS)}>
        <SketchShort spec={spec} />
      </Freeze>
      <div
        style={{
          position: "absolute",
          top: 1360,
          left: SIDE,
          right: SIDE,
          padding: "40px 40px 44px",
          borderRadius: 40,
          background: theme.gradient.darkPanel,
          boxShadow: theme.shadow.crimsonButton,
          textAlign: "center",
          color: theme.color.white,
        }}
      >
        <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 64, letterSpacing: -1 }}>Answer at 6:30 PM</div>
        <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 38, marginTop: 10, color: theme.color.pinkBorder }}>
          Reply with your answer first
        </div>
      </div>
    </>
  );
};

export type StoryProps = { story: Story };

export const StoryComposition: React.FC<StoryProps> = ({ story }) => {
  const c = story.content;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.color.white }}>
      {c.type === "share" ? <Share c={c} /> : c.type === "tip" ? <Tip c={c} /> : c.type === "word" ? <Word c={c} /> : <SatTeaser c={c} />}
    </AbsoluteFill>
  );
};
