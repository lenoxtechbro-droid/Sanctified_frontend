/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1e3a5f",
          light: "#2c5282",
          dark: "#0f2744",
        },
        gold: {
          DEFAULT: "#c9a227",
          light: "#e5c04a",
          dark: "#9a7b1a",
        },
        sanctified: {
          red: "#b91c1c",
          white: "#fafafa",
        },
      },
      fontFamily: {
        sans: ["Georgia", "Cambria", "Times New Roman", "serif"],
        display: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
