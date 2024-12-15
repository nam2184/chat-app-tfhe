/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*{.js,.jsx,.ts,.tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ["Work Sans", "sans-serif"],
    },
    screens: {
      "xs": { min: "0px", max: "639px" },
      "sm": { min: "640px", max: "767px" },
      "md": { min: "768px", max: "1023px" },
      "lg": { min: "1024px", max: "1279px" },
      "xl": { min: "1280px", max: "1535px" },
      "2xl": { min: "1536px" },
    },
    extend: {
      colors: {
        "prussianBlue": {
          100: "#cfd4d8",
          200: "#9fa9b1",
          300: "#6e7d8a",
          400: "#3e5263",
          500: "#0e273c",
          600: "#0b1f30",
          700: "#081724",
          800: "#061018",
          900: "#03080c"
        },
        "spanishViolet": {
          100: "#dbd6e2",
          200: "#b7acc5",
          300: "#9283a7",
          400: "#6e598a",
          500: "#4a306d",
          600: "#3b2657",
          700: "#2c1d41",
          800: "#1e132c",
          900: "#0f0a16"
        },
        "purple": {
          100: "#ece1ed",
          200: "#d9c2db",
          300: "#c7a4c9",
          400: "#b485b7",
          500: "#a167a5",
          600: "#815284",
          700: "#613e63",
          800: "#402942",
          900: "#201521"
        },
        "thistle": {
          100: "#f6f2f5",
          200: "#ede4eb",
          300: "#e5d7e0",
          400: "#dcc9d6",
          500: "#d3bccc",
          600: "#a996a3",
          700: "#7f717a",
          800: "#544b52",
          900: "#2a2629"
        },
        "palePurple": {
          100: "#faf7fc",
          200: "#f6eff9",
          300: "#f1e7f7",
          400: "#eddff4",
          500: "#e8d7f1",
          600: "#baacc1",
          700: "#8b8191",
          800: "#5d5660",
          900: "#2e2b30"
        },
      },
      fontFamily: {
        workSans: ["Work Sans", "sans-serif"]
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding'
      }
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp')
  ],
}
