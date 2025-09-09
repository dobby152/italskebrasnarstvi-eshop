import { Metadata } from 'next'

export interface SEOData {
  title: string
  description: string
  keywords?: string[]
  canonicalUrl?: string
  image?: string
  noIndex?: boolean
  noFollow?: boolean
  alternates?: {
    languages?: Record<string, string>
  }
}

export interface ProductSEOData extends SEOData {
  product: {
    name: string
    price: number
    currency: string
    availability: 'in_stock' | 'out_of_stock' | 'preorder'
    brand: string
    category: string
    sku: string
    images: string[]
    description: string
    rating?: {
      value: number
      count: number
    }
  }
}

export interface CategorySEOData extends SEOData {
  category: {
    name: string
    description: string
    productsCount: number
    parent?: string
  }
}

// SEO Configuration
export const SEO_CONFIG = {
  siteName: 'Italské brašnářství',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://italskebrasnarstvi.cz',
  defaultTitle: 'Italské brašnářství - Premium italské kožené výrobky',
  defaultDescription: 'Objevte naši exkluzivní kolekci italských kožených kabelek, peněženek a aktovek. Oficiální distributor značky Piquadro v České republice.',
  defaultImage: '/og-image.jpg',
  twitterHandle: '@italskebrasnarstvi',
  facebookPage: 'https://facebook.com/italskebrasnarstvi',
  instagramHandle: '@italskebrasnarstvi'
} as const

// Generate SEO-friendly slug
export function generateSlug(text: string, id?: number): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim()
  
  return id ? `${slug}-${id}` : slug
}

// Generate canonical URL
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${SEO_CONFIG.siteUrl}${cleanPath}`
}

// Generate basic metadata
export function generateMetadata({
  title,
  description,
  keywords = [],
  canonicalUrl,
  image = SEO_CONFIG.defaultImage,
  noIndex = false,
  noFollow = false,
  alternates
}: SEOData): Metadata {
  const fullTitle = title === SEO_CONFIG.defaultTitle 
    ? title 
    : `${title} | ${SEO_CONFIG.siteName}`

  const fullImageUrl = image.startsWith('http') 
    ? image 
    : `${SEO_CONFIG.siteUrl}${image}`

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    alternates: {
      canonical: canonicalUrl,
      ...alternates
    },

    openGraph: {
      type: 'website',
      siteName: SEO_CONFIG.siteName,
      title: fullTitle,
      description,
      url: canonicalUrl,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'cs_CZ',
    },

    twitter: {
      card: 'summary_large_image',
      site: SEO_CONFIG.twitterHandle,
      creator: SEO_CONFIG.twitterHandle,
      title: fullTitle,
      description,
      images: [fullImageUrl],
    },

    other: {
      'facebook-domain-verification': 'your-facebook-domain-verification-code',
    },
  }
}

// Generate product metadata
export function generateProductMetadata(data: ProductSEOData): Metadata {
  const { product } = data
  
  const title = `${product.name} - ${product.brand} | ${SEO_CONFIG.siteName}`
  const description = `${product.description.substring(0, 155)}... ✓ ${product.brand} ✓ Dostupnost: ${product.availability === 'in_stock' ? 'Skladem' : 'Na objednávku'} ✓ Cena: ${product.price.toLocaleString('cs-CZ')} Kč`
  
  const keywords = [
    product.name.toLowerCase(),
    product.brand.toLowerCase(),
    product.category.toLowerCase(),
    'italské kožené výrobky',
    'premium kabelky',
    'značkové peněženky',
    'kožená galanterie'
  ]

  const baseMetadata = generateMetadata({
    ...data,
    title,
    description,
    keywords
  })

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      type: 'product',
      images: product.images.map(img => ({
        url: img,
        width: 800,
        height: 800,
        alt: product.name,
      })),
    },
  }
}

// Generate category metadata
export function generateCategoryMetadata(data: CategorySEOData): Metadata {
  const { category } = data
  
  const title = `${category.name} - ${category.productsCount} produktů | ${SEO_CONFIG.siteName}`
  const description = `Objevte naši kolekci ${category.name.toLowerCase()} - ${category.productsCount} kvalitních italských kožených výrobků. ${category.description}`
  
  const keywords = [
    category.name.toLowerCase(),
    'italské kožené výrobky',
    'premium kožená galanterie',
    'značkové kabelky',
    'italské peněženky',
    'Piquadro'
  ]

  return generateMetadata({
    ...data,
    title,
    description,
    keywords
  })
}

// Generate breadcrumb JSON-LD
export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

// Generate organization JSON-LD
export function generateOrganizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    logo: `${SEO_CONFIG.siteUrl}/logo.png`,
    sameAs: [
      SEO_CONFIG.facebookPage,
      `https://instagram.com/${SEO_CONFIG.instagramHandle.replace('@', '')}`,
      `https://twitter.com/${SEO_CONFIG.twitterHandle.replace('@', '')}`
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+420-xxx-xxx-xxx',
      contactType: 'customer service',
      availableLanguage: ['cs', 'sk']
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CZ',
      addressLocality: 'Praha'
    }
  }
}

// Generate product JSON-LD
export function generateProductJsonLd(product: ProductSEOData['product']): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    category: product.category,
    sku: product.sku,
    image: product.images,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${
        product.availability === 'in_stock' ? 'InStock' :
        product.availability === 'out_of_stock' ? 'OutOfStock' : 'PreOrder'
      }`,
      seller: {
        '@type': 'Organization',
        name: SEO_CONFIG.siteName
      }
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.value,
        reviewCount: product.rating.count
      }
    })
  }
}

// Generate FAQ JSON-LD
export function generateFAQJsonLd(faqs: Array<{ question: string; answer: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}