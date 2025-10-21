import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
      remotePatterns: [
        { protocol: "https", hostname: "lh3.googleusercontent.com" },
        // ha később másik aldomén is jönne:
        // { protocol: "https", hostname: "lh4.googleusercontent.com" },
        // { protocol: "https", hostname: "lh5.googleusercontent.com" },
        // { protocol: "https", hostname: "lh6.googleusercontent.com" },
      ],
    },
};

export default nextConfig;
