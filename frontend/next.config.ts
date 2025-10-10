import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Force server restart to clear cache
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
