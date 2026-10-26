import React from "react";
import { Img, staticFile } from "remotion";
import { fitSize } from "../text";
import { theme } from "../theme";
import { BOTTOM, Card, CheckDot, Frame, Headline, PAD, TOP } from "./Frame";
import { SERIES_LABEL, slideCount, type PostContent, type Step } from "./post";

const body = (size = 44): React.CSSProperties => ({
  fontFamily: theme.font.body,
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1.4,
  color: theme.color.body,
});

const Area: React.FC<{ children: React.ReactNode; center?: boolean; style?: React.CSSProperties }> = ({
  children,
  center,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      top: TOP,
      bottom: 1350 - BOTTOM,
      left: PAD,
      right: PAD,
      display: "flex",
      flexDirection: "column",
      justifyContent: center ? "center" : "flex-start",
      gap: 40,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Big outlined step number, e.g. "02" (the content really is a sequence). */
const StepNumber: React.FC<{ n: number; onPink?: boolean }> = ({ n }) => (
  <div
    style={{
      fontFamily: theme.font.heading,
      fontWeight: 900,
      fontSize: 230,
      lineHeight: 0.9,
      color: "transparent",
      WebkitTextStroke: `5px ${theme.color.crimson}`,
      letterSpacing: -6,
    }}
  >
    {String(n).padStart(2, "0")}
  </div>
);

const StepSlide: React.FC<{ step: Step; n: number }> = ({ step, n }) => (
  <Area center style={{ gap: 34 }}>
    <StepNumber n={n} />
    <div
      style={{
        fontFamily: theme.font.heading,
        fontWeight: 900,
        fontSize: fitSize([step.title], 92, 920),
        lineHeight: 1.08,
        letterSpacing: -2,
        color: theme.color.ink,
      }}
    >
      {step.title}
    </div>
    <div style={body(50)}>{step.detail}</div>
    {step.tip ? (
      <div
        style={{
          marginTop: 10,
          padding: "30px 36px",
          borderRadius: 28,
          backgroundColor: theme.color.pinkBg,
          border: `3px solid ${theme.color.pinkBorder}`,
          ...body(38),
          color: theme.color.ink,
        }}
      >
        <span
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 900,
            color: theme.color.crimson,
            letterSpacing: 1.5,
            fontSize: 26,
            display: "block",
            marginBottom: 8,
          }}
        >
          PRO TIP
        </span>
        {step.tip}
      </div>
    ) : null}
  </Area>
);

const Bookmark: React.FC = () => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"
      stroke="white"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const Share: React.FC = () => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
    <path d="M21 3L10 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M21 3l-7 18-4-7-7-4 18-7z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

/** Crimson closing slide: icon + two lines. */
const ClosingSlide: React.FC<{ icon: React.ReactNode; line1: string; line2: string; sub?: string }> = ({
  icon,
  line1,
  line2,
  sub,
}) => (
  <Area center style={{ alignItems: "center", textAlign: "center", gap: 36 }}>
    {icon}
    <Headline
      line1={line1}
      line2={line2}
      size={fitSize([line1], 104, 900)}
      size2={fitSize([line2], 104, 900)}
      onDark
      align="center"
    />
    {sub ? <div style={{ ...body(40), color: "rgba(255,255,255,0.85)" }}>{sub}</div> : null}
  </Area>
);

// ---------------- Monday: checklist ----------------
const Checklist: React.FC<{ c: Extract<PostContent, { type: "checklist" }>; i: number }> = ({ c, i }) => {
  const last = c.steps.length + 1;
  if (i === 0)
    return (
      <Area style={{ justifyContent: "center", gap: 46 }}>
        <Headline
          line1={c.title}
          line2={c.highlight}
          size={fitSize([c.title], 116, 920)}
          size2={fitSize([c.highlight], 110, 920)}
        />
        <div style={body(44)}>{c.subtitle}</div>
        <Card style={{ padding: "34px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
          {c.steps.map((s, k) => (
            <div
              key={k}
              style={{ display: "flex", alignItems: "center", gap: 24, ...body(36), color: theme.color.ink }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: `4px solid ${theme.color.crimson}`,
                  flexShrink: 0,
                }}
              />
              {s.title}
            </div>
          ))}
        </Card>
      </Area>
    );
  if (i === last)
    return (
      <ClosingSlide icon={<Bookmark />} line1="Save this," line2={c.saveLine} sub="Send it to a friend who needs it." />
    );
  return <StepSlide step={c.steps[i - 1]} n={i} />;
};

// ---------------- Tuesday: guess the admit ----------------
const AdmitCard: React.FC<{ c: Extract<PostContent, { type: "admit-guess" }>; reveal: boolean }> = ({ c, reveal }) => {
  const ok = c.result === "Accepted";
  const stampColor = ok ? "#15803d" : theme.color.crimson;
  return (
    <Card style={{ padding: "46px 48px", position: "relative" }}>
      <div
        style={{
          fontFamily: theme.font.heading,
          fontWeight: 900,
          fontSize: fitSize([c.university], 60, 760),
          color: theme.color.ink,
          lineHeight: 1.1,
          paddingRight: reveal ? 0 : 110, // keep clear of the "?" bubble
        }}
      >
        {c.university}
      </div>
      <div style={{ ...body(38), marginTop: 8 }}>{c.course}</div>
      <div style={{ display: "flex", gap: 16, marginTop: 22 }}>
        {[c.intake, ...(c.major ? [`UG major: ${c.major}`] : [])].map((t) => (
          <span
            key={t}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              backgroundColor: theme.color.pinkBg,
              border: `2px solid ${theme.color.pinkBorder}`,
              ...body(28),
              color: theme.color.ink,
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 34 }}>
        {c.stats.map((s) => (
          <div
            key={s.label}
            style={{
              padding: "24px 28px",
              borderRadius: 24,
              backgroundColor: theme.color.pinkBg,
              gridColumn: c.stats.length === 1 ? "span 2" : undefined,
            }}
          >
            <div style={{ ...body(28), color: theme.color.muted }}>{s.label}</div>
            <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 52, color: theme.color.crimson }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
      {/* result */}
      <div style={{ position: "absolute", ...(reveal ? { top: 128, right: 28 } : { top: -46, right: 30 }) }}>
        {reveal ? (
          <div
            style={{
              padding: "14px 34px",
              border: `9px solid ${stampColor}`,
              borderRadius: 22,
              color: stampColor,
              backgroundColor: "rgba(255,255,255,0.95)",
              fontFamily: theme.font.heading,
              fontWeight: 900,
              fontSize: 54,
              letterSpacing: 3,
              transform: "rotate(-8deg)",
            }}
          >
            {c.result.toUpperCase()}
          </div>
        ) : (
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 999,
              background: theme.gradient.button,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: theme.font.heading,
              fontWeight: 900,
              fontSize: 92,
              boxShadow: theme.shadow.crimsonButton,
            }}
          >
            ?
          </div>
        )}
      </div>
    </Card>
  );
};

const AdmitGuess: React.FC<{ c: Extract<PostContent, { type: "admit-guess" }>; i: number }> = ({ c, i }) => (
  <Area style={{ gap: 64, justifyContent: "center" }}>
    {i === 0 ? (
      <Headline
        line1="Your guess:"
        line2="accept or reject?"
        size={104}
        size2={fitSize(["accept or reject?"], 104, 920)}
      />
    ) : (
      <Headline line1="Result:" line2={`${c.result}!`} size={104} />
    )}
    <AdmitCard c={c} reveal={i === 1} />
    <div style={{ ...body(36), color: theme.color.muted }}>
      {i === 0 ? "Comment your answer, then swipe." : c.takeaway}
    </div>
  </Area>
);

// ---------------- Wednesday: portal feature ----------------
const Feature: React.FC<{ c: Extract<PostContent, { type: "feature" }>; i: number }> = ({ c, i }) => {
  if (i === 0)
    return (
      <Area center style={{ gap: 30 }}>
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 4,
            color: theme.color.pinkBorder,
          }}
        >
          EDUABROAD PORTAL
        </div>
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: fitSize([c.feature], 150, 920),
            color: "white",
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          {c.feature}
        </div>
        <div style={{ ...body(52), color: theme.color.pinkBorder, fontFamily: theme.font.heading, fontWeight: 800 }}>
          {c.promise}
        </div>
      </Area>
    );
  if (i === 1)
    return (
      <Area style={{ alignItems: "center", gap: 34 }}>
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: fitSize([c.screenshotCaption], 64, 900),
            color: theme.color.ink,
            textAlign: "center",
          }}
        >
          {c.screenshotCaption}
        </div>
        <div
          style={{
            width: 520,
            height: 820,
            borderRadius: 54,
            border: `12px solid ${theme.color.ink}`,
            overflow: "hidden",
            boxShadow: "0 40px 90px rgba(15,23,42,0.25)",
            backgroundColor: "white",
          }}
        >
          <div style={{ position: "relative" }}>
            <Img src={staticFile(c.screenshot)} style={{ width: "100%", display: "block" }} />
            {(c.screenshotBlur ?? []).map((r, k) => {
              const s = 496 / (c.screenshotWidth ?? 798); // phone screen is 496px wide inside the frame
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: r.x * s,
                    top: r.y * s,
                    width: r.w * s,
                    height: r.h * s,
                    overflow: "hidden",
                    borderRadius: 6,
                  }}
                >
                  <Img
                    src={staticFile(c.screenshot)}
                    style={{ position: "absolute", left: -r.x * s, top: -r.y * s, width: 496, filter: "blur(9px)" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Area>
    );
  if (i === 2)
    return (
      <Area center style={{ gap: 44 }}>
        <Headline line1="What you get" size={100} />
        {c.benefits.map((b) => (
          <Card key={b} style={{ padding: "32px 36px", display: "flex", alignItems: "center", gap: 30 }}>
            <CheckDot size={74} />
            <div
              style={{
                fontFamily: theme.font.heading,
                fontWeight: 800,
                fontSize: 46,
                lineHeight: 1.2,
                color: theme.color.ink,
              }}
            >
              {b}
            </div>
          </Card>
        ))}
      </Area>
    );
  if (i === 3)
    return (
      <Area center style={{ gap: 40 }}>
        <Headline line1="How to use it" size={fitSize(["How to use it"], 100, 920)} />
        {c.howTo.map((h, k) => (
          <div key={h} style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                flexShrink: 0,
                border: `5px solid ${theme.color.crimson}`,
                color: theme.color.crimson,
                fontFamily: theme.font.heading,
                fontWeight: 900,
                fontSize: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white",
              }}
            >
              {k + 1}
            </div>
            <div style={{ ...body(46), color: theme.color.ink }}>{h}</div>
          </div>
        ))}
      </Area>
    );
  return (
    <Area center style={{ alignItems: "center", gap: 60 }}>
      <Img src={staticFile("brand/edulogo.png")} style={{ width: 760 }} />
      <div
        style={{
          padding: "34px 84px",
          borderRadius: 999,
          background: theme.gradient.button,
          color: "white",
          fontFamily: theme.font.heading,
          fontWeight: 900,
          fontSize: 66,
          boxShadow: theme.shadow.crimsonButton,
        }}
      >
        {c.button} →
      </div>
      <div
        style={{
          fontFamily: theme.font.heading,
          fontWeight: 800,
          fontSize: fitSize([c.url], 54, 920),
          color: theme.color.ink,
          whiteSpace: "nowrap",
        }}
      >
        {c.url}
      </div>
    </Area>
  );
};

// ---------------- Thursday: this vs that ----------------
const Versus: React.FC<{ c: Extract<PostContent, { type: "versus" }> }> = ({ c }) => (
  <Area center style={{ gap: 28 }}>
    <Headline
      line1={c.title}
      line2={c.highlight}
      size={fitSize([c.title], 88, 920)}
      size2={fitSize([c.highlight], 88, 920)}
    />
    <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      {[c.left, c.right].map((name, k) => (
        <div
          key={name}
          style={{
            // inner side padding keeps the label clear of the VS circle
            padding: k === 0 ? "26px 56px 26px 20px" : "26px 20px 26px 56px",
            borderRadius: 26,
            textAlign: "center",
            whiteSpace: "nowrap",
            color: "white",
            background: k === 0 ? theme.color.ink : theme.gradient.button,
            fontFamily: theme.font.heading,
            fontWeight: 900,
            fontSize: fitSize([name], 46, 360),
          }}
        >
          {name}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 86,
          height: 86,
          borderRadius: 999,
          backgroundColor: "white",
          border: `4px solid ${theme.color.pinkBorder}`,
          color: theme.color.crimson,
          fontFamily: theme.font.heading,
          fontWeight: 900,
          fontSize: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        VS
      </div>
    </div>
    <Card style={{ padding: "8px 34px" }}>
      {c.rows.map((r, k) => (
        <div key={r.label} style={{ padding: "16px 0", borderTop: k ? `2px solid ${theme.color.pinkBg}` : "none" }}>
          <div
            style={{
              fontFamily: theme.font.heading,
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: 2,
              color: theme.color.crimson,
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {r.label}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 6 }}>
            <div style={{ ...body(32), lineHeight: 1.3, color: theme.color.ink }}>{r.left}</div>
            <div style={{ ...body(32), lineHeight: 1.3, color: theme.color.ink, textAlign: "right" }}>{r.right}</div>
          </div>
        </div>
      ))}
    </Card>
    <div
      style={{
        padding: "22px 30px",
        borderRadius: 26,
        backgroundColor: theme.color.pinkBg,
        border: `3px solid ${theme.color.pinkBorder}`,
        ...body(32),
        color: theme.color.ink,
      }}
    >
      <b style={{ color: theme.color.crimson }}>Bottom line: </b>
      {c.bottomLine}
    </div>
  </Area>
);

// ---------------- Friday: myth vs fact ----------------
const Myth: React.FC<{ c: Extract<PostContent, { type: "myth" }> }> = ({ c }) => (
  <Area style={{ gap: 46, justifyContent: "center" }}>
    <div style={{ position: "relative" }}>
      <div style={{ ...body(38), color: theme.color.muted, marginBottom: 30 }}>People say...</div>
      <Card style={{ padding: "58px 44px 48px", backgroundColor: theme.color.pinkBg }}>
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 800,
            // long myths drop a size so they stay on two lines
            fontSize: Math.min(fitSize([c.myth.slice(0, Math.ceil(c.myth.length / 2))], 70, 820), c.myth.length > 32 ? 56 : 70),
            lineHeight: 1.18,
            color: theme.color.ink,
            textDecorationLine: "line-through",
            textDecorationThickness: 7,
            textDecorationColor: "rgba(165,28,48,0.85)",
          }}
        >
          “{c.myth}”
        </div>
      </Card>
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          padding: "6px 28px",
          border: `8px solid ${theme.color.crimson}`,
          borderRadius: 20,
          color: theme.color.crimson,
          backgroundColor: "rgba(255,255,255,0.95)",
          fontFamily: theme.font.heading,
          fontWeight: 900,
          fontSize: 52,
          letterSpacing: 4,
          transform: "rotate(-7deg)",
        }}
      >
        MYTH
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <CheckDot size={78} />
      <span
        style={{
          fontFamily: theme.font.heading,
          fontWeight: 900,
          fontSize: 60,
          letterSpacing: 4,
          color: theme.color.crimson,
        }}
      >
        FACT
      </span>
    </div>
    <div
      style={{
        fontFamily: theme.font.heading,
        fontWeight: 900,
        fontSize: fitSize([c.fact.slice(0, Math.ceil(c.fact.length / 2))], 88, 900),
        lineHeight: 1.1,
        letterSpacing: -2,
        color: theme.color.ink,
      }}
    >
      {c.fact}
    </div>
    <div style={body(42)}>{c.detail}</div>
  </Area>
);

// ---------------- Saturday: IELTS word ----------------
const Word: React.FC<{ c: Extract<PostContent, { type: "word" }> }> = ({ c }) => (
  <Area center style={{ gap: 38 }}>
    <div style={{ ...body(36), color: theme.color.muted }}>Word of the week</div>
    <div
      style={{
        fontFamily: theme.font.heading,
        fontWeight: 900,
        fontSize: fitSize([c.word], 190, 920),
        letterSpacing: -4,
        lineHeight: 0.95,
        backgroundImage: theme.gradient.headlineText,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        paddingBottom: 10,
      }}
    >
      {c.word}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <span
        style={{
          padding: "10px 24px",
          borderRadius: 999,
          backgroundColor: theme.color.ink,
          color: "white",
          fontFamily: theme.font.heading,
          fontWeight: 800,
          fontSize: 28,
        }}
      >
        {c.partOfSpeech}
      </span>
      <span style={{ ...body(42), color: theme.color.ink }}>{c.meaning}</span>
    </div>
    <div>
      <div
        style={{
          fontFamily: theme.font.heading,
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: 2.5,
          color: theme.color.crimson,
          marginBottom: 16,
        }}
      >
        SYNONYMS
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {c.synonyms.map((s) => (
          <span
            key={s}
            style={{
              padding: "16px 32px",
              borderRadius: 999,
              border: `3px solid ${theme.color.pinkBorder}`,
              backgroundColor: "white",
              fontFamily: theme.font.heading,
              fontWeight: 800,
              fontSize: 40,
              color: theme.color.ink,
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
    <Card style={{ padding: "34px 40px" }}>
      <div
        style={{
          fontFamily: theme.font.heading,
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: 2.5,
          color: theme.color.crimson,
          marginBottom: 10,
        }}
      >
        EXAMPLE
      </div>
      <div style={{ ...body(40), color: theme.color.ink, fontStyle: "italic" }}>{c.example}</div>
    </Card>
  </Area>
);

// ---------------- Sunday: parents' corner ----------------
const Parents: React.FC<{ c: Extract<PostContent, { type: "parents" }>; i: number }> = ({ c, i }) => {
  const last = c.answers.length + 1;
  if (i === 0)
    return (
      <Area center style={{ gap: 40 }}>
        <div style={{ ...body(40), color: theme.color.muted }}>{c.label}</div>
        <div style={{ position: "relative" }}>
          <Card style={{ padding: "60px 56px", borderRadius: 48 }}>
            <div
              style={{
                fontFamily: theme.font.heading,
                fontWeight: 900,
                fontSize: fitSize([c.question.slice(0, Math.ceil(c.question.length / 2))], 96, 820),
                lineHeight: 1.1,
                letterSpacing: -2,
                color: theme.color.ink,
              }}
            >
              “{c.question}”
            </div>
          </Card>
          {/* speech-bubble tail */}
          <div
            style={{
              position: "absolute",
              left: 90,
              bottom: -34,
              width: 70,
              height: 70,
              backgroundColor: "white",
              borderRight: `3px solid ${theme.color.pinkBorder}`,
              borderBottom: `3px solid ${theme.color.pinkBorder}`,
              transform: "rotate(45deg)",
            }}
          />
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: 46,
            color: theme.color.crimson,
          }}
        >
          {c.answers.length} straight answers →
        </div>
      </Area>
    );
  if (i === last)
    return <ClosingSlide icon={<Share />} line1="Parents worried?" line2={c.closing} sub="One share, half the worry." />;
  return <StepSlide step={c.answers[i - 1]} n={i} />;
};

/** Which background each slide uses. */
export const toneFor = (c: PostContent, i: number): "light" | "pink" | "crimson" => {
  const total = slideCount(c);
  if (c.type === "feature" && i === 0) return "crimson";
  if ((c.type === "checklist" || c.type === "parents") && i === total - 1) return "crimson";
  if (c.type === "parents" && i > 0) return "pink";
  if (c.type === "admit-guess" && i === 1) return "pink";
  return "light";
};

export const Slide: React.FC<{ content: PostContent; index: number }> = ({ content: c, index: i }) => {
  const total = slideCount(c);
  let inner: React.ReactNode = null;
  if (c.type === "checklist") inner = <Checklist c={c} i={i} />;
  if (c.type === "admit-guess") inner = <AdmitGuess c={c} i={i} />;
  if (c.type === "feature") inner = <Feature c={c} i={i} />;
  if (c.type === "versus") inner = <Versus c={c} />;
  if (c.type === "myth") inner = <Myth c={c} />;
  if (c.type === "word") inner = <Word c={c} />;
  if (c.type === "parents") inner = <Parents c={c} i={i} />;
  return (
    <Frame series={SERIES_LABEL[c.type]} index={i} total={total} tone={toneFor(c, i)}>
      {inner}
    </Frame>
  );
};
