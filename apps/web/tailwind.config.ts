import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        fitrah: {
          sand: "#f8f2e8",
          clay: "#c1864a",
          deep: "#1a232f",
          emerald: "#1f6f5f"
        }
      }
    }
  },
  plugins: []
};

export default config;
