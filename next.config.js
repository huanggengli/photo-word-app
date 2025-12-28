/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['s3.siliconflow.cn'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.siliconflow.cn',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;

