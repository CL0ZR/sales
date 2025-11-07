import type { NextConfig } from "next";
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  // Output standalone for production builds
  output: 'standalone',

  // Support for better-sqlite3 in API routes
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize better-sqlite3 for server-side
      config.externals = config.externals || [];
      config.externals.push('better-sqlite3');
    }

    return config;
  },

  // Enable experimental features for server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default withPWA(nextConfig);
