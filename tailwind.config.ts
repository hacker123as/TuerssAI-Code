import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#fdf8f3",
          100: "#f9ede0",
          200: "#f2d9bc",
          300: "#e8bf8f",
          400: "#dda066",
          500: "#d4843d",
          600: "#c66b32",
          700: "#a5532b",
          800: "#844429",
          900: "#6b3a24",
          950: "#3a1c10",
        },
        tuerss: {
          orange: "#d4843d",
          tan: "#e8bf8f",
          dark: "#3a1c10",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
