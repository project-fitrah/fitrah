import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        scholar: {
          parchment: "#f5f0e5",
          ink: "#14213d",
          saffron: "#d97706",
          mint: "#0f766e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
