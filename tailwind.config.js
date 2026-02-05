/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#060a12",
        navy: "#0c1a33",
        teal: "#5ce0ff",
        electric: "#72a8ff",
        mist: "#dfe9ff"
      },
      boxShadow: {
        glow: "0 0 45px rgba(92, 224, 255, 0.28)",
        soft: "0 24px 70px rgba(4, 8, 18, 0.35)",
        "inner-glow": "inset 0 0 20px rgba(92, 224, 255, 0.15)"
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at top left, rgba(92, 224, 255, 0.18), transparent 55%), radial-gradient(circle at 20% 40%, rgba(114, 168, 255, 0.25), transparent 60%)"
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "pulse-slow": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    }
  },
  plugins: []
};