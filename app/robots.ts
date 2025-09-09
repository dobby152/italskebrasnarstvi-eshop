import { MetadataRoute } from 'next'
import { SEO_CONFIG } from '@/app/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SEO_CONFIG.siteUrl
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout/',
          '/ucet/',
          '/prihlaseni/',
          '/registrace/',
          '/*?*utm_*',
          '/*?*fbclid*',
          '/*?*gclid*',
          '/kosik/',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}