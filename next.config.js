/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dbnfkzctensbpktgbsgn.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'all',
        },
      }
    }
    return config
  },
  // Force static optimization for better chunk handling
  trailingSlash: false,
  // Optimize chunks
  swcMinify: true
}

module.exports = nextConfig