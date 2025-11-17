import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
      remotePatterns: [
        { protocol: "https", hostname: "lh3.googleusercontent.com" },
        { protocol: "https", hostname: "lh4.googleusercontent.com" },
        { protocol: "https", hostname: "lh5.googleusercontent.com" },
        { protocol: "https", hostname: "lh6.googleusercontent.com" },
        {
          protocol: 'https',
          hostname: 'res.cloudinary.com',
          pathname: '/dfagrsgsz/**',
        },
      ],
    },
    eslint: {
      ignoreDuringBuilds: true,
  },
};

export default nextConfig;
