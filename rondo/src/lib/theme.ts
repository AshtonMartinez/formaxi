// Design tokens extracted from the Rondo prototype
// These complement the Tailwind theme — use for JS-side logic (e.g. dynamic styles)

export const colors = {
  bg: {
    base: "#0b110d",
    surface: "#111a13",
    surfaceAlt: "#131c15",
    sidebar: "#0e150f",
    input: "#0d140f",
    elevated: "#161f18",
  },
  border: {
    DEFAULT: "rgba(255,255,255,0.07)",
    subtle: "rgba(255,255,255,0.06)",
    muted: "rgba(255,255,255,0.045)",
    strong: "rgba(255,255,255,0.12)",
  },
  text: {
    primary: "#eef2ee",
    secondary: "#9aa89e",
    muted: "#8c9a90",
    dim: "#5f6d63",
    heading: "#cfd8d1",
    dark: "#4f5b52",
  },
  accent: {
    green: "#34e07f",
    greenDark: "#1f9a52",
    greenBg: "rgba(52,224,127,0.14)",
    greenBgSubtle: "rgba(52,224,127,0.10)",
    greenBorder: "rgba(52,224,127,0.18)",
    greenDarker: "#07140c",
  },
  status: {
    win: "#34e07f",
    draw: "#d9a925",
    loss: "#e0463d",
    orange: "#ff6a3d",
    orangeLight: "#ff8a5f",
  },
  crest: {
    green: "#1f9a52",
    blue: "#3b82f6",
    orange: "#ff6a3d",
    purple: "#8b5cf6",
    yellow: "#eab308",
    pink: "#ec4899",
    cyan: "#06b6d4",
    red: "#ef4444",
    teal: "#14b8a6",
    slate: "#64748b",
    lime: "#84cc16",
  },
} as const;

export type CrestColor = keyof typeof colors.crest;
