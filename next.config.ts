import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",
  experimental: {
    runtime: "nodejs",
  },
};

export default nextConfig;