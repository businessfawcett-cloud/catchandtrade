/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
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
