/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['dbnfkzctensbpktgbsgn.supabase.co']
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {}
}

module.exports = nextConfig