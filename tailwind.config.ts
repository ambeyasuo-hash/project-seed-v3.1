import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // srcフォルダの中身すべてを監視
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;