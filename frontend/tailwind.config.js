/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        slate: {
          850: "#0f1729",
          950: "#0a0f1e",
        },
      },
      backgroundImage: {
        "mesh-gradient":
          "radial-gradient(at 40% 20%, hsla(197, 100%, 63%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(162, 100%, 50%, 0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(179, 100%, 67%, 0.3) 0px, transparent 50%)",
      },
      animation: {
        "slide-in-right": "slide-in-right 0.5s ease-out",
        "slide-in-left": "slide-in-left 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in-up": {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(20, 184, 166, 0.5)" },
          "50%": {
            boxShadow:
              "0 0 40px rgba(20, 184, 166, 0.8), 0 0 60px rgba(20, 184, 166, 0.6)",
          },
        },
      },
    },
  },
  plugins: [],
};
