import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Force server restart to clear cache
  poweredByHeader: false,
  // Explicitly set the output file tracing root to the frontend directory
  // This resolves the warning about multiple lockfiles in the workspace
  outputFileTracingRoot: path.join(__dirname),
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