/**
 * One Instagram Story = one 1080 x 1920 image. At most one a day:
 *   Mon, Thu  "share"  today's feed post, with a "New post" label      (13:30 IST)
 *   Tue       "tip"    a short tip, written in stories/YYYY-MM-DD.json   (13:30 IST)
 *   Fri       "word"   an IELTS word, written in stories/YYYY-MM-DD.json (13:30 IST)
 *   Sat       "sat"    the SAT Short's question as a teaser            (10:30 IST)
 * Same writing and claims rules as the posts (WRITING-RULES.md).
 * Instagram's API can't add stickers (polls, links, mentions), so Stories are plain images.
 */
import type { PostContent } from "../posts/post";
import type { SketchSpec } from "../sketch/spec";

export type StoryContent =
  | { type: "share"; image: string; postType: PostContent["type"] } // image: path inside public/ (slide 1 of the post)
  | { type: "tip"; title: string; highlight: string; points: string[] }
  | { type: "word"; word: string; partOfSpeech: string; meaning: string; synonyms: string[]; example: string }
  | { type: "sat"; spec: SketchSpec; at?: number }; // a still of the SAT Short (default: teaserTime)

export type Story = {
  date: string;
  content: StoryContent;
  claims: { text: string; source: string }[];
};

/** Instagram covers the top ~250px (profile bar) and bottom ~250px (reply bar) of a Story. */
export const STORY_SAFE = { top: 250, bottom: 1670, side: 80 };

/** The teaser moment of a SAT Short: the question is fully written, just before the solution starts. */
export const teaserTime = (spec: SketchSpec): number => {
  const pause = spec.items.find((i) => i.kind === "text" && /Pause/.test(i.text)) as { out?: number } | undefined;
  if (pause && pause.out !== undefined) return pause.out - 0.1;
  return Math.min(spec.seconds / 3, 10);
};
