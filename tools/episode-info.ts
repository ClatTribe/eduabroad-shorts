// Prints timing facts about an episode as JSON (used by tools/render.sh).
import { readFileSync } from "node:fs";
import { dropSeconds, scenesFor, totalSeconds, type Episode } from "../src/episode";

const ep = JSON.parse(readFileSync(process.argv[2], "utf8")) as Episode;
let t = 0;
const scenes = scenesFor(ep).map((s) => {
  const out = { ...s, start: t, mid: t + s.seconds / 2 };
  t += s.seconds;
  return out;
});
console.log(JSON.stringify({ duration: totalSeconds(ep), drop: dropSeconds(ep), musicSeed: ep.musicSeed, scenes }));
