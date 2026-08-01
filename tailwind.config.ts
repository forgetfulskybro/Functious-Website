import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        crimson:        "#7B1515",
        "red-dark":     "#8B2010",
        "red-warm":     "#A52F05",
        "orange-mid":   "#C44010",
        orange:         "#D45510",
        "orange-bright":"#E06510",
        "orange-light": "#F07820",
        "orange-warm":  "#FF8C00",
        "bg-dark":      "#0D0505",
        "bg-card":      "#150D0D",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Geist Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
