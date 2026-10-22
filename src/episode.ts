/**
 * One Short = one Episode (a JSON file in episodes/YYYY-MM-DD.json).
 * The scheduled Claude session writes this file; the templates turn it into video.
 * Keep on-screen text short, warm Hinglish, and never use em dashes.
 */
import type { CardShot } from "./cards";

export type Template = "feature" | "tips" | "mythfact" | "quiz" | "solve";
export type Series = "portal" | "seedhi-baat" | "myth-fact" | "sat";

export type Hook = {
  /** Words of line 1 and line 2; each pops in one by one. */
  line1: string[];
  line2: string[];
  /** Word that gets the crimson gradient (must appear in line1 or line2). */
  highlight: string;
  subline: string;
  /** Optional wobbly chips under the question (a made-up example profile, never a real person). */
  chips?: string[];
};

export type Clip =
  | {
      kind: "video";
      /** Path inside public/, e.g. "footage/admit-finder/scroll.mp4" */
      src: string;
      caption: string;
      subcaption: string;
      seconds: number;
      playbackRate?: number;
      trimStartSeconds?: number;
    }
  | {
      kind: "card";
      /** A name from src/cards.ts (e.g. "admit-accepted") or a full CardShot. */
      card: string | CardShot;
      caption: string;
      subcaption: string;
      seconds: number;
    };

export type Episode = {
  date: string; // YYYY-MM-DD
  series: Series;
  template: Template;
  /** Seeds the music so every episode sounds a little different. */
  musicSeed: number;

  hook: Hook;

  /** template: feature (Version 1 structure) */
  build?: {
    beats: { speaker: string; line: string }[];
    googleTabs?: string[];
    punchline: { line1: string; line2: string };
  };
  reveal?: {
    kicker: string;
    headline: string;
    featurePill: string;
    clips: Clip[];
  };
  proof?: { points: string[] };

  /** template: tips (Seedhi Baat) */
  tips?: {
    seriesLabel: string; // e.g. "Seedhi Baat"
    items: { title: string; detail: string }[];
  };

  /** template: mythfact (Myth vs Fact) */
  myths?: {
    seriesLabel: string; // e.g. "Myth vs Fact"
    items: { myth: string; fact: string; detail: string }[];
  };

  /** template: quiz (SAT Quick Quiz): one real practice question, countdown, answer, why */
  quiz?: {
    seriesLabel: string; // e.g. "SAT Quick Quiz"
    section: string; // e.g. "Grammar"
    prompt: string; // e.g. "Blank mein kya aayega?"
    /** The question text; "____" marks the blank, which fills with the answer on reveal. */
    passage: string;
    options: string[]; // exactly 4, shown as A to D
    answer: number; // index into options
    why: { title: string; focus: string; points: string[] };
  };

  /** template: solve (SAT Solve It): one real question worked out step by step. Math uses ^{} for powers. */
  solve?: {
    seriesLabel: string; // e.g. "SAT Math"
    section: string; // e.g. "Advanced Math"
    question: string;
    options?: string[]; // leave out for a grid-in (student-produced) answer
    pauseLine: string; // e.g. "Pause and try it first"
    steps: { label: string; math: string[] }[]; // math pieces reveal one by one
    answer: string; // e.g. "155" or "D"
    takeaway: string; // one line under the answer
  };

  /** Not shown by every template (solve skips it). */
  closing: { line1: string; line2: string };
  cta: { button: string; url: string };

  /** Upload metadata */
  youtube: { title: string; description: string; tags: string[] };
  instagram: { caption: string };
  /** Every factual claim shown on screen, with where it comes from (portal page / magazine URL / "general advice"). */
  claims: { text: string; source: string }[];
};

// ---------------- timeline ----------------
// Fixed scene lengths (seconds). Templates stay the same; only words and footage change.
export const T = {
  hook: 3,
  beat: 2.2,
  punchline: 2.4,
  revealIntro: 1.2,
  proof: 5,
  seriesCard: 1.2,
  tip: 4.2,
  myth: 2.4,
  fact: 4.2,
  closing: 2.6,
  cta: 3,
  problem: 5,
  step: 3.6,
  result: 4,
  question: 10, // read (4s) + options + 5 second countdown
  answer: 3.4,
  why: 6,
};

export type SceneSpan = { name: string; seconds: number };

export const scenesFor = (ep: Episode): SceneSpan[] => {
  const hook = { name: "hook", seconds: T.hook };
  const cta = { name: "cta", seconds: T.cta };
  if (ep.template === "feature") {
    const build = (ep.build?.beats.length ?? 0) * T.beat + T.punchline;
    const reveal = T.revealIntro + (ep.reveal?.clips ?? []).reduce((s, c) => s + c.seconds, 0);
    return [
      hook,
      { name: "build", seconds: build },
      { name: "reveal", seconds: reveal },
      { name: "proof", seconds: T.proof },
      cta,
    ];
  }
  if (ep.template === "tips") {
    const tips = T.seriesCard + (ep.tips?.items.length ?? 0) * T.tip;
    return [hook, { name: "tips", seconds: tips }, { name: "closing", seconds: T.closing }, cta];
  }
  if (ep.template === "solve") {
    return [
      hook,
      { name: "problem", seconds: T.problem },
      { name: "steps", seconds: (ep.solve?.steps.length ?? 0) * T.step + 0.6 },
      { name: "result", seconds: T.result },
      cta,
    ];
  }
  if (ep.template === "quiz") {
    return [
      hook,
      { name: "question", seconds: T.question },
      { name: "answer", seconds: T.answer },
      { name: "why", seconds: T.why },
      { name: "closing", seconds: T.closing },
      cta,
    ];
  }
  const myths = T.seriesCard + (ep.myths?.items.length ?? 0) * (T.myth + T.fact);
  return [hook, { name: "myths", seconds: myths }, { name: "closing", seconds: T.closing }, cta];
};

export const totalSeconds = (ep: Episode) => scenesFor(ep).reduce((s, x) => s + x.seconds, 0);

/** Where the music "drop" lands: the moment the answer appears. */
export const dropSeconds = (ep: Episode) => {
  const spans = scenesFor(ep);
  const idx = spans.findIndex((s) => ["reveal", "tips", "myths", "answer", "steps"].includes(s.name));
  return spans.slice(0, idx).reduce((s, x) => s + x.seconds, 0);
};
