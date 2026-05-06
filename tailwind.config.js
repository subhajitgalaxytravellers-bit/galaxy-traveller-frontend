/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["var(--font-sans)", "Poppins", "sans-serif"],
        heading: ["var(--font-heading)", "Playfair Display", "Georgia", "serif"],
        display: ["var(--font-display)", "DM Serif Display", "Georgia", "serif"],
        mono:    ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
