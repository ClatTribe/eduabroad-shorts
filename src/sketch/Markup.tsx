import React from "react";
import { interpolate } from "remotion";
import { RoughBox } from "./Rough";
import { INK, inkColor } from "./spec";

type Node =
  | { t: "text"; s: string }
  | { t: "sup"; kids: Node[] }
  | { t: "color"; color: string; kids: Node[] }
  | { t: "box"; color: string; at: number; kids: Node[] }
  | { t: "hl"; at: number; kids: Node[] };

/** Parses the sketch markup (see spec.ts) into a small tree. */
export const parse = (src: string): Node[] => {
  let i = 0;
  const seq = (stop?: string): Node[] => {
    const out: Node[] = [];
    let buf = "";
    const flush = () => {
      if (buf) out.push({ t: "text", s: buf });
      buf = "";
    };
    while (i < src.length) {
      const c = src[i];
      if (stop && c === stop) break;
      if (c === "^") {
        flush();
        i++;
        if (src[i] === "{") {
          i++;
          const kids = seq("}");
          i++;
          out.push({ t: "sup", kids });
        } else out.push({ t: "sup", kids: [{ t: "text", s: src[i++] }] });
        continue;
      }
      if (c === "{") {
        flush();
        const bar = src.indexOf("|", i);
        const head = src.slice(i + 1, bar).trim().split(/\s+/);
        i = bar + 1;
        const kids = seq("}");
        i++;
        if (head[0] === "box") out.push({ t: "box", color: head[1] ?? "ink", at: Number(head[2] ?? 0), kids });
        else if (head[0] === "hl") out.push({ t: "hl", at: Number(head[1] ?? 0), kids });
        else out.push({ t: "color", color: head[0], kids });
        continue;
      }
      buf += c;
      i++;
    }
    flush();
    return out;
  };
  return seq();
};

/** Plain text of the markup, for timing and fact checks. */
export const plain = (nodes: Node[]): string =>
  nodes.map((n) => (n.t === "text" ? n.s : plain(n.kids))).join("");

/** Every decoration time in the markup (boxes, highlights), for sound cues. */
export const decorations = (nodes: Node[]): { kind: "box" | "hl"; at: number }[] =>
  nodes.flatMap((n) =>
    n.t === "box" || n.t === "hl" ? [{ kind: n.t, at: n.at }, ...decorations(n.kids)] : n.t === "text" ? [] : decorations(n.kids),
  );

/** Renders parsed markup at time `t` (seconds). */
export const Markup: React.FC<{ nodes: Node[]; t: number; idBase: string }> = ({ nodes, t, idBase }) => (
  <>
    {nodes.map((n, k) => {
      const id = `${idBase}.${k}`;
      if (n.t === "text") return <span key={k}>{n.s}</span>;
      if (n.t === "sup")
        return (
          <sup key={k} style={{ fontSize: "0.58em", verticalAlign: "0.8em", lineHeight: 0, marginLeft: "0.03em" }}>
            <Markup nodes={n.kids} t={t} idBase={id} />
          </sup>
        );
      if (n.t === "color")
        return (
          <span key={k} style={{ color: inkColor(n.color) }}>
            <Markup nodes={n.kids} t={t} idBase={id} />
          </span>
        );
      if (n.t === "box") {
        const p = interpolate(t, [n.at, n.at + 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <span key={k} style={{ position: "relative", display: "inline-block", padding: "0 0.06em" }}>
            {p > 0 ? <RoughBox id={id} color={inkColor(n.color)} progress={p} /> : null}
            <Markup nodes={n.kids} t={t} idBase={id} />
          </span>
        );
      }
      // highlighter swipe behind the text
      const p = interpolate(t, [n.at, n.at + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <span key={k} style={{ position: "relative", display: "inline-block", isolation: "isolate", padding: "0 0.08em" }}>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: "0.22em",
              bottom: "0.02em",
              width: `${p * 100}%`,
              backgroundColor: INK.highlighter,
              borderRadius: "0.1em 0.35em 0.15em 0.3em",
              transform: "rotate(-1.2deg)",
              zIndex: -1,
            }}
          />
          <Markup nodes={n.kids} t={t} idBase={id} />
        </span>
      );
    })}
  </>
);
