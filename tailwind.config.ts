import type { Config } from "tailwindcss";

const config = {
  darkMode: "class",
  theme: {
    extend: {
      boxShadow: {
        spa: "0 8px 30px rgba(0,0,0,.06)",
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
      },
    },
  },
} satisfies Config;

export default config;
