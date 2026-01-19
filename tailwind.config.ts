import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // src配下すべてを対象にする
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;