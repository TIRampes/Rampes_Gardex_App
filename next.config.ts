import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coordinated-pod-ut2vzaph.t3.storageapi.dev',
      },
      {
        protocol: 'https',
        hostname: 't3.storageapi.dev',
      },
    ],
  },
  
};

export default nextConfig;