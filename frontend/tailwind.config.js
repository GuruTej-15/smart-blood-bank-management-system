/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF8",
        ink: "#1C1917",
        muted: "#57534E",
        crimson: { DEFAULT: "#9F1239", dark: "#7C0F30", light: "#FCE7EC" },
        pulse: { DEFAULT: "#DC2626", light: "#FEE2E2" },
        vital: { DEFAULT: "#15803D", light: "#DCFCE7" },
        amber: { DEFAULT: "#B45309", light: "#FEF3C7" },
        stone: { DEFAULT: "#E7E5E4", dark: "#D6D3D1" },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        breathe: "breathe 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};


