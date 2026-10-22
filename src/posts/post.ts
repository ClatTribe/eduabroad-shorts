/**
 * One social post = one JSON file in posts/YYYY-MM-DD.json.
 * Instagram feed format: 1080 x 1350 (4:5). Carousels render one PNG per slide.
 * Same writing and claims rules as the Shorts (WRITING-RULES.md).
 */

export type Step = { title: string; detail: string; tip?: string };

export type PostContent =
  | {
      type: "checklist"; // Monday: Seedhi Baat checklist carousel
      title: string;
      highlight: string;
      subtitle: string;
      steps: Step[];
      saveLine: string;
    }
  | {
      type: "admit-guess"; // Tuesday: Guess the Admit (2 slides)
      university: string;
      course: string;
      intake: string;
      major?: string;
      stats: { label: string; value: string }[];
      result: "Accepted" | "Rejected";
      takeaway: string;
    }
  | {
      type: "feature"; // Wednesday: Portal feature carousel
      feature: string;
      promise: string;
      screenshot: string; // path inside public/
      screenshotCaption: string;
      /** Areas of the screenshot to blur (pixels of the original image), e.g. a student's college. */
      screenshotBlur?: { x: number; y: number; w: number; h: number }[];
      screenshotWidth?: number; // original pixel width of the screenshot (default 798)
      benefits: string[];
      howTo: string[];
      button: string;
      url: string;
    }
  | {
      type: "versus"; // Thursday: This vs That
      title: string;
      highlight: string;
      left: string;
      right: string;
      rows: { label: string; left: string; right: string }[];
      bottomLine: string;
    }
  | {
      type: "myth"; // Friday: Myth vs Fact
      myth: string;
      fact: string;
      detail: string;
    }
  | {
      type: "word"; // Saturday: IELTS Shabd
      word: string;
      partOfSpeech: string;
      meaning: string;
      synonyms: string[];
      example: string;
    }
  | {
      type: "parents"; // Sunday: Parents' Corner carousel
      label: string;
      question: string;
      answers: Step[];
      closing: string;
    };

export type Post = {
  date: string;
  content: PostContent;
  caption: string; // Instagram caption, incl. hashtags (5 max)
  claims: { text: string; source: string }[];
};

export const SERIES_LABEL: Record<PostContent["type"], string> = {
  checklist: "Seedhi Baat",
  "admit-guess": "Guess the Admit",
  feature: "Portal Feature",
  versus: "This vs That",
  myth: "Myth vs Fact",
  word: "IELTS Shabd",
  parents: "Parents' Corner",
};

export const slideCount = (c: PostContent): number => {
  switch (c.type) {
    case "checklist":
      return c.steps.length + 2;
    case "admit-guess":
      return 2;
    case "feature":
      return 5;
    case "parents":
      return c.answers.length + 2;
    default:
      return 1;
  }
};
