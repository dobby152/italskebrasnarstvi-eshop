import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { supabase } from '@/app/lib/supabase'
import { 
  generateProductMetadata, 
  generateProductJsonLd, 
  generateBreadcrumbJsonLd, 
  generateSlug,
  getCanonicalUrl,
  SEO_CONFIG 
} from '@/app/lib/seo'
import { StructuredData } from '@/app/components/seo/structured-data'
import ProductPageClient from './client'

interface ProductPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  images: string[]
  sku: string
  normalized_brand: string
  collection_name: string
  availability: number
  created_at: string
  updated_at: string
}

// Extract ID from slug (format: product-name-123)
function extractIdFromSlug(slug: string): number | null {
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]
  const id = parseInt(lastPart)
  return isNaN(id) ? null : id
}

function getSupabaseImageUrl(imagePath: string): string {
  if (!imagePath) return '/placeholder.svg'
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // Convert database path to Supabase storage URL
  const SUPABASE_STORAGE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images'
  return `${SUPABASE_STORAGE_URL}/${imagePath.replace(/^\/+/, '')}`
}

async function getProduct(slug: string): Promise<Product | null> {
  const id = extractIdFromSlug(slug)
  if (!id) return null

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !product) return null

  // Verify slug matches current product name
  const expectedSlug = generateSlug(product.name, product.id)
  if (slug !== expectedSlug) {
    // Redirect to correct URL would be handled by middleware
    return null
  }

  // Transform image URLs
  if (product.image_url) {
    product.image_url = getSupabaseImageUrl(product.image_url)
  }
  
  if (product.images && Array.isArray(product.images)) {
    product.images = product.images.map((img: string) => getSupabaseImageUrl(img))
  }

  return product
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  
  if (!product) {
    return {
      title: 'Produkt nenalezen',
      robots: { index: false, follow: false }
    }
  }

  const canonicalUrl = getCanonicalUrl(`/produkty/${slug}`)
  const mainImage = product.image_url || (product.images?.[0])

  return generateProductMetadata({
    title: `${product.name} - ${product.normalized_brand}`,
    description: product.description,
    canonicalUrl,
    image: mainImage,
    keywords: [
      product.name.toLowerCase(),
      product.normalized_brand.toLowerCase(),
      product.collection_name.toLowerCase(),
      'italské kožené výrobky',
      'premium kabelky'
    ],
    product: {
      name: product.name,
      price: product.price,
      currency: 'CZK',
      availability: product.availability > 0 ? 'in_stock' : 'out_of_stock',
      brand: product.normalized_brand,
      category: product.collection_name,
      sku: product.sku,
      images: product.images || [product.image_url].filter(Boolean),
      description: product.description,
      rating: {
        value: 4.5, // Mock - implement real ratings
        count: 12
      }
    }
  })
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  // Generate structured data
  const productJsonLd = generateProductJsonLd({
    name: product.name,
    price: product.price,
    currency: 'CZK',
    availability: product.availability > 0 ? 'in_stock' : 'out_of_stock',
    brand: product.normalized_brand,
    category: product.collection_name,
    sku: product.sku,
    images: product.images || [product.image_url].filter(Boolean),
    description: product.description,
    rating: {
      value: 4.5,
      count: 12
    }
  })

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Domů', url: SEO_CONFIG.siteUrl },
    { name: 'Produkty', url: `${SEO_CONFIG.siteUrl}/produkty` },
    { name: product.collection_name, url: `${SEO_CONFIG.siteUrl}/kategorie/${generateSlug(product.collection_name)}` },
    { name: product.name, url: `${SEO_CONFIG.siteUrl}/produkty/${slug}` }
  ])

  return (
    <>
      <StructuredData data={[productJsonLd, breadcrumbJsonLd]} />
      <ProductPageClient initialProduct={product} slug={slug} />
    </>
  )
}