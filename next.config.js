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
  // Force static export to avoid edge runtime issues
  trailingSlash: true,
  // Disable experimental features
  experimental: {},
}

module.exports = nextConfig