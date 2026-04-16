/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
    ignoreTypeErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/grading/calculate',
        destination: '/api/grading',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/(.*)',
        has: [{ type: 'host', value: 'www\\.catchandtrade\\.com' }],
        destination: 'https://catchandtrade.com/:(.*)',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
