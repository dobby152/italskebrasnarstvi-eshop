import { NextRequest, NextResponse } from 'next/server'

// Rate limiting map to track requests per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// Rate limiting function
function checkRateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  
  const ipData = rateLimitMap.get(ip)
  
  if (!ipData || ipData.resetTime < now) {
    // First request or window expired
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (ipData.count >= maxRequests) {
    return false // Rate limit exceeded
  }
  
  // Increment count
  ipData.count++
  return true
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Get client IP
  const clientIP = getClientIP(request)
  
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const isAllowed = checkRateLimit(clientIP, 120, 60000) // 120 requests per minute per IP
    
    if (!isAllowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    }
  }
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' data: blob:",
    "connect-src 'self' https: wss:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // HTTPS redirect in production
  if (process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'http:') {
    const httpsUrl = request.nextUrl.clone()
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }
  
  return response
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}