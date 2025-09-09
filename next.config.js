/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ultra minimal config to fix chunk loading issues
  images: {
    domains: ['dbnfkzctensbpktgbsgn.supabase.co']
  },
  // Disable all optimizations that might cause MIME type issues
  swcMinify: false,
  compress: false,
  poweredByHeader: false,
  reactStrictMode: false,
  // Disable webpack optimizations that cause chunking issues
  webpack: (config, { isServer, dev }) => {
    // Disable code splitting to prevent chunk loading errors
    if (!isServer && !dev) {
      config.optimization.splitChunks = false
      config.optimization.runtimeChunk = false
    }
    return config
  },
  // Disable experimental features
  experimental: {},
  // Force output to be standalone
  output: 'standalone',
}

module.exports = nextConfig