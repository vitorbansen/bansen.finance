import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identidade visual: preto profundo, branco Apple e dourado (usado com parcimônia)
        ash: "#f5f5f7",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E6C866",
        },
        surface: "#0a0a0a",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
    },
  },
  plugins: [],
};

export default config;
