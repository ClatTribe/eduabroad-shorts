/** Global look-and-sound settings shared by every episode. */

/** Turn on to see YouTube's "keep text out" zones while previewing. */
export const SHOW_SAFE_ZONES = false;

/** Blur the student's undergrad college on real admit-card close-ups. */
export const PRIVACY_BLUR = true;

/** Overall loudness of all sound effects (pops, whooshes, dings). 0 to 1. */
export const SFX_VOLUME = 0.6;

/** Background music: generated per episode into public/audio/music.wav (tools/make_music.py). */
export const MUSIC = { file: "audio/music.wav", volume: 0.42 };

export const WATERMARK = {
  file: "brand/images.svg",
  /** Scenes where the square icon is hidden (they show the full logo or the hook). */
  hiddenIn: ["hook", "cta"],
  opacity: 0.75,
};
