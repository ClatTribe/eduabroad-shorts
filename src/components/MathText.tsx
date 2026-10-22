import React from "react";

/**
 * Tiny math markup for on-screen equations: "2^{2x}" or "5^2" become superscripts.
 *   <MathText text="2^{x} + 2^{2x}" />
 */
export const MathText: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => {
  const parts: React.ReactNode[] = [];
  const re = /\^(\{([^}]*)\}|(.))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <sup key={k++} style={{ fontSize: "0.6em", verticalAlign: "0.75em", lineHeight: 0, marginLeft: "0.04em" }}>
        {m[2] ?? m[3]}
      </sup>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span style={style}>{parts}</span>;
};

/** The text as it reads without markup, for measuring and fact checks: "2^{2x}" -> "22x". */
export const plainMath = (text: string) => text.replace(/\^\{([^}]*)\}/g, "$1").replace(/\^(.)/g, "$1");
