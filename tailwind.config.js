/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        navy: "#0a1b3d",
        teal: "#24d3c5",
        electric: "#3aa9ff",
        mist: "#e6eefb"
      },
      boxShadow: {
        glow: "0 0 40px rgba(36, 211, 197, 0.25)",
        soft: "0 20px 60px rgba(9, 18, 38, 0.18)"
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at top left, rgba(36, 211, 197, 0.18), transparent 55%), radial-gradient(circle at 20% 40%, rgba(58, 169, 255, 0.25), transparent 60%)"
      }
    }
  },
  plugins: []
};

