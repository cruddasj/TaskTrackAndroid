/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0e0e0e",
        surface: "#0e0e0e",
        "surface-bright": "#2c2c2c",
        "surface-container": "#1a1a1a",
        "surface-container-high": "#20201f",
        "surface-container-highest": "#262626",
        "surface-container-low": "#131313",
        "surface-container-lowest": "#000000",
        "surface-dim": "#0e0e0e",
        "surface-tint": "#91f78e",
        "surface-variant": "#262626",

        primary: "#91f78e",
        "on-primary": "#005e17",
        "primary-container": "#52b555",
        "on-primary-container": "#002a06",

        secondary: "#86faac",
        "on-secondary": "#005f32",
        "secondary-container": "#006d3a",
        "on-secondary-container": "#e3ffe6",

        tertiary: "#90f1ff",
        "on-tertiary": "#005b64",
        "tertiary-container": "#11eaff",
        "on-tertiary-container": "#005159",

        error: "#ff7351",
        "on-error": "#450900",
        "error-container": "#b92902",
        "on-error-container": "#ffd2c8",

        "on-surface": "#ffffff",
        "on-surface-variant": "#adaaaa",

        outline: "#767575",
        "outline-variant": "#484847",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      borderRadius: {
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
