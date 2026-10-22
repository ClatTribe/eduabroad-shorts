import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

// Font files are bundled in public/fonts so rendering works offline.
const FONTS = [
  { family: "Montserrat", weight: "600", file: "montserrat-latin-600-normal.woff2" },
  { family: "Montserrat", weight: "700", file: "montserrat-latin-700-normal.woff2" },
  { family: "Montserrat", weight: "800", file: "montserrat-latin-800-normal.woff2" },
  { family: "Montserrat", weight: "900", file: "montserrat-latin-900-normal.woff2" },
  { family: "Lato", weight: "400", file: "lato-latin-400-normal.woff2" },
  { family: "Lato", weight: "700", file: "lato-latin-700-normal.woff2" },
  { family: "Lato", weight: "900", file: "lato-latin-900-normal.woff2" },
];

let started = false;

export const loadFonts = () => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("Loading Montserrat + Lato");
  Promise.all(
    FONTS.map((f) =>
      new FontFace(f.family, `url(${staticFile(`fonts/${f.file}`)}) format("woff2")`, {
        weight: f.weight,
      })
        .load()
        .then((face) => document.fonts.add(face)),
    ),
  )
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
};
