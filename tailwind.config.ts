import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        'ddt-bg': '#0C1220',
        'ddt-surface': '#141C2E',
        'ddt-raised': '#1C2640',
        'ddt-input': '#1A2235',
        'ddt-border': '#2A3550',
        'ddt-border-strong': '#3A4A6A',
        'ddt-accent': '#F59E0B',
        'ddt-accent-dim': '#92610A',
        'ddt-accent-bg': '#2A1F05',
        'ddt-text': '#E8EAF0',
        'ddt-muted': '#8892A4',
        'ddt-faint': '#4A5568',
      },
      fontFamily: {
        syne: ["var(--font-syne)"],
        sans: ["var(--font-dm-sans)"],
        mono: ["var(--font-jetbrains-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
