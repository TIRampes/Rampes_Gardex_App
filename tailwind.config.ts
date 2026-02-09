export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gardex: {
          orange: "#F5A623",
          "orange-light": "#FFBD4A",
          "orange-dark": "#D4890F",
          black: "#1a2332",
          "black-light": "#2d3748",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
