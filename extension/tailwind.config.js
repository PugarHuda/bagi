/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./popup.tsx", "./components/**/*.tsx", "./contents/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        bg: "hsl(0 0% 6%)",
        surface: "hsl(0 0% 10%)",
        border: "hsl(0 0% 18%)",
        muted: "hsl(0 0% 60%)",
        fg: "hsl(0 0% 96%)",
        brand: "#e84142", // Bagi red
      },
    },
  },
  plugins: [],
};
