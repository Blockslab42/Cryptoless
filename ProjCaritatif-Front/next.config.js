/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ['ipfs.io', 'localhost'],
  },
}

module.exports = nextConfig
