import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.tacdn.com" },
      { protocol: "https", hostname: "media-cdn.tripadvisor.com" },
      { protocol: "https", hostname: "media-cdn.tripadvisor.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
