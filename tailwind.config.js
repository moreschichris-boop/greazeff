/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        abyss: "#0f1b2d",
        panel: "#131f33",
        line: "#233350",
        teal: "#2dd4bf",
        tealDeep: "#0d9488",
        ember: "#f97316",
        gold: "#eab308",
        bone: "#e7ecf3",
        mute: "#8ca0bd",
      },
      fontFamily: {
        display: ["'Bebas Neue'", "Impact", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        depth: "radial-gradient(circle at 20% -10%, #17263f 0%, #0b1220 60%)",
      },
    },
  },
  plugins: [],
};
