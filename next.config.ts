import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'fluxerusercontent.com' },
      { protocol: 'https', hostname: 'fluxerstatic.com' },
    ],
  },
};

export default nextConfig;
