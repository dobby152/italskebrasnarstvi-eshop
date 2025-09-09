/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emergency configuration to fix chunk loading
  swcMinify: false,
  compress: false,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dbnfkzctensbpktgbsgn.supabase.co',
      }
    ]
  },
  
  // Disable all optimizations
  compiler: {
    removeConsole: false,
  },

  poweredByHeader: false,
}

module.exports = nextConfig