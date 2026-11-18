import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every app route reads the auth session at request time, so we opt out of
  // Cache Components and render these routes dynamically.
  cacheComponents: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
