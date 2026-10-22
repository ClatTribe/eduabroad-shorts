/**
 * EduAbroad brand tokens, copied from the portal code (ClatTribe/eduportal):
 * - colors: src/app/page.tsx, components/PainPoints.tsx, lib/brand-theme.ts
 * - fonts:  src/app/globals.css (Montserrat headings, Lato body)
 * - radius / buttons: Tailwind classes used across the portal, scaled ~2.5x
 *   because the video is 1080px wide and the portal is designed for ~430px phones.
 */
export const theme = {
  color: {
    crimson: "#A51C30", // main brand color
    crimsonHover: "#8A1828", // button hover
    crimsonDeep: "#6B1420",
    crimsonBright: "#E0314B", // top of headline gradient
    crimsonTextEnd: "#7A1524", // bottom of headline gradient
    pinkBg: "#FEF2F3",
    pinkBorder: "#FECDD3",
    pinkSoft: "#FCA5A5",
    ink: "#0F172A", // slate-900, headlines + dark "Get Started" button
    body: "#475569", // slate-600, body text
    muted: "#64748B",
    white: "#FFFFFF",
    gridLine: "#F1F5F9", // homepage background grid
  },
  font: {
    heading: "Montserrat, sans-serif",
    body: "Lato, sans-serif",
  },
  radius: {
    pill: 9999, // rounded-full (portal CTAs)
    card: 40, // rounded-2xl
    button: 28, // rounded-xl
  },
  gradient: {
    /** Headline text gradient: "Without the Noise" on the homepage. */
    headlineText: "linear-gradient(to bottom, #E0314B, #7A1524)",
    /** Dark crimson panel: bg-gradient-to-br from-[#A51C30] via-[#8A1828] to-[#6B1420]. */
    darkPanel: "linear-gradient(135deg, #A51C30 0%, #8A1828 55%, #6B1420 100%)",
    /** Primary button: bg-gradient-to-r from-[#A51C30] to-[#8A1828]. */
    button: "linear-gradient(to right, #A51C30, #8A1828)",
  },
  shadow: {
    /** "Experience the Difference" button: 0 10px 20px rgba(165,28,48,0.3), scaled. */
    crimsonButton: "0 22px 44px rgba(165, 28, 48, 0.32)",
    card: "0 24px 70px rgba(15, 23, 42, 0.12)",
    soft: "0 10px 40px rgba(165, 28, 48, 0.10)",
  },
} as const;

/** YouTube Shorts UI covers the top 10% and bottom 20% of the screen. */
export const SAFE = {
  top: 192, // 10% of 1920
  bottom: 1536, // 80% of 1920
  side: 70,
};
