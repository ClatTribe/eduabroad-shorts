import { interpolate, spring } from "remotion";

/** Snappy spring used for most entrances. Returns 0 -> 1. */
export const pop = (frame: number, fps: number, delay = 0, stiffness = 200) =>
  spring({ frame: frame - delay, fps, config: { damping: 14, stiffness, mass: 0.6 } });

/** Softer spring for big panels. */
export const glide = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 120, mass: 0.8 } });

/** Fade + shrink out over the last `frames` of a scene. Returns 1 -> 0. */
export const exitOut = (frame: number, duration: number, frames = 6) =>
  interpolate(frame, [duration - frames, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Gentle never-static float, so nothing sits still. */
export const float = (frame: number, amp = 6, speed = 0.08, phase = 0) => Math.sin(frame * speed + phase) * amp;

export const sec = (seconds: number, fps: number) => Math.round(seconds * fps);
