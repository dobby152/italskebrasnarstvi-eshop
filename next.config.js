/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration for maximum Vercel compatibility
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dbnfkzctensbpktgbsgn.supabase.co',
      }
    ]
  },
  
  // Security headers only
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
        ]
      }
    ]
  },

  poweredByHeader: false,
}

module.exports = nextConfig