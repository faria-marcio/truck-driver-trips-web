/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
    ],
  },
};

module.exports = nextConfig;