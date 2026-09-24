import type { Config } from "tailwindcss";

/** Cor a partir de variável "R G B" para suportar opacidade (bg-card/50 etc.). */
const v = (nome: string) => `rgb(var(--${nome}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        card: v("card"),
        "card-2": v("card-2"),
        label: v("label"),
        "label-2": v("label-2"),
        "label-3": v("label-3"),
        sep: v("sep"),
        fill: v("fill"),
        tint: v("tint"),
        verde: v("verde"),
        vermelho: v("vermelho"),
        laranja: v("laranja"),
        barra: v("barra"),
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
