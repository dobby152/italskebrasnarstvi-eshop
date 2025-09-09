import crypto from 'crypto'

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  SKU: /^[A-Z0-9-_]{3,50}$/i,
  POSTAL_CODE: /^[\d\s-]{3,10}$/,
  NAME: /^[a-zA-ZÀ-ÿčďěňřšťžČĎĚŇŘŠŤŽ\s'-]{2,50}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const

// Sanitization functions
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially harmful characters
    .substring(0, 1000) // Limit length
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function sanitizeNumber(input: string | number, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
  const num = typeof input === 'string' ? parseFloat(input) : input
  if (isNaN(num)) return 0
  return Math.min(Math.max(num, min), max)
}

// Input validation functions
export function validateEmail(email: string): boolean {
  return VALIDATION_PATTERNS.EMAIL.test(email) && email.length <= 254
}

export function validatePassword(password: string): boolean {
  return VALIDATION_PATTERNS.PASSWORD.test(password) && password.length >= 8 && password.length <= 128
}

export function validateSKU(sku: string): boolean {
  return VALIDATION_PATTERNS.SKU.test(sku)
}

export function validateName(name: string): boolean {
  return VALIDATION_PATTERNS.NAME.test(name)
}

// SQL injection prevention
export function preventSQLInjection(query: string): boolean {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /[;'"].*?[;'"]/g,
    /\/\*.*?\*\//g,
    /--.*$/gm,
  ]
  
  return !suspiciousPatterns.some(pattern => pattern.test(query))
}

// XSS prevention
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function validateCSRFToken(token: string, expected: string): boolean {
  if (!token || !expected) return false
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

// Password hashing utilities (for reference, actual hashing should use bcrypt)
export function hashPassword(password: string): Promise<string> {
  // This is a simplified example - use bcrypt in production
  return new Promise((resolve) => {
    crypto.pbkdf2(password, 'salt', 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) throw err
      resolve(derivedKey.toString('hex'))
    })
  })
}

// Secure random string generation
export function generateSecureRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// API key validation
export function validateApiKey(key: string): boolean {
  // Basic API key format validation
  return /^[a-zA-Z0-9_-]{32,}$/.test(key)
}

// Request body size validation
export function validateRequestSize(body: any, maxSizeBytes: number = 1024 * 1024): boolean {
  const bodySize = JSON.stringify(body).length
  return bodySize <= maxSizeBytes
}

// File upload security
export function validateFileType(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.toLowerCase().split('.').pop()
  return extension ? allowedExtensions.includes(extension) : false
}

export function validateFileSize(size: number, maxSizeBytes: number): boolean {
  return size <= maxSizeBytes
}

// Security headers helper
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}