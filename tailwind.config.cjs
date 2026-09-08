/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#047857", // emerald green
        background: "#0a0a0a", // deep navy / charcoal base
        surface: "#111827", // off‑white surfaces (actually dark surface) adjust as needed
        "surface-light": "#1f2937"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
