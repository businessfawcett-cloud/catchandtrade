/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
