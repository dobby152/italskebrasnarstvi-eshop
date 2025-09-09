/** @type {import('next').NextConfig} */
const nextConfig = {
  // Absolutely minimal config - nuclear option
  images: {
    domains: ['dbnfkzctensbpktgbsgn.supabase.co']
  },
  // Turn off everything that might cause issues
  swcMinify: false,
  compress: false,
  poweredByHeader: false,
  reactStrictMode: false,
  // Nuclear webpack config - force single bundle
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // Completely disable code splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          bundle: {
            name: 'bundle',
            chunks: 'all',
            enforce: true
          }
        }
      }
      config.optimization.runtimeChunk = false
      config.optimization.minimize = false
    }
    return config
  },
  // Completely disable experimental features
  experimental: {},
  // Remove problematic output mode
  // output: 'export', // Try static export instead
}

module.exports = nextConfig