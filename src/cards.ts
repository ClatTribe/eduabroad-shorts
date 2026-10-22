/**
 * Geometry for the real admit-card screenshots used in close-ups.
 * All numbers are pixels inside the cropped screenshot (798 x 1380).
 * If you replace a card image, these boxes need updating to match it.
 */
export type Box = { x: number; y: number; w: number; h: number };

export type CardShot = {
  image: string;
  /** The part of the screenshot that contains the card. */
  crop: Box;
  /** Crimson highlight rings, popping in this order. */
  highlights: Box[];
  /** Undergrad college line, blurred when PRIVACY_BLUR is on. */
  privateLine: Box;
};

/** Tufts University, Mechanical Engineering, Fall 2025: Rejected (GPA 8.5/10, IELTS 9). */
export const REJECTED_CARD: CardShot = {
  image: "footage/admit-finder/card-rejected.png",
  crop: { x: 24, y: 303, w: 752, h: 564 },
  highlights: [
    { x: 412, y: 682, w: 330, h: 128 }, // IELTS 9
    { x: 590, y: 446, w: 152, h: 50 }, // Rejected badge
  ],
  privateLine: { x: 76, y: 592, w: 400, h: 46 },
};

/** University of Texas, Dallas, Computer Engineering, Spring 2025: Accepted (GPA 8.6/10, GRE 318). */
export const ACCEPTED_CARD: CardShot = {
  image: "footage/admit-finder/card-accepted.png",
  crop: { x: 24, y: 289, w: 752, h: 757 },
  highlights: [
    { x: 578, y: 431, w: 164, h: 50 }, // Accepted badge
    { x: 58, y: 707, w: 329, h: 129 }, // GPA
    { x: 412, y: 707, w: 330, h: 129 }, // GRE
  ],
  privateLine: { x: 76, y: 578, w: 520, h: 46 },
};

/** Cards an episode can refer to by name (Clip.card). */
export const CARDS: Record<string, CardShot> = {
  "admit-accepted": ACCEPTED_CARD,
  "admit-rejected": REJECTED_CARD,
};
