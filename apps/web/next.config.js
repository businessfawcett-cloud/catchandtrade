const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@catchandtrade/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    // Force all React imports to the same instance to prevent
    // styled-jsx/useContext failures during SSR in monorepo setups
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, '../../node_modules/react'),
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
