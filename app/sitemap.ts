import { MetadataRoute } from 'next'
import { supabase } from '@/app/lib/supabase'
import { SEO_CONFIG, generateSlug } from '@/app/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SEO_CONFIG.siteUrl
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/produkty`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/o-nas`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kontakt`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/obchodni-podminky`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  try {
    // Get products for dynamic pages
    const { data: products } = await supabase
      .from('products')
      .select('id, name, updated_at, created_at')
      .not('availability', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000) // Limit for performance

    const productPages: MetadataRoute.Sitemap = products?.map(product => ({
      url: `${baseUrl}/produkty/${generateSlug(product.name, product.id)}`,
      lastModified: new Date(product.updated_at || product.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []

    // Get categories
    const { data: categories } = await supabase
      .from('products')
      .select('collection_name, collection_code')
      .not('collection_name', 'is', null)
      .not('collection_code', 'is', null)

    const uniqueCategories = categories ? 
      Array.from(new Set(categories.map(c => c.collection_code)))
        .map(code => categories.find(c => c.collection_code === code))
        .filter(Boolean)
      : []

    const categoryPages: MetadataRoute.Sitemap = uniqueCategories.map(category => ({
      url: `${baseUrl}/kategorie/${generateSlug(category!.collection_name)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Get brands
    const { data: brands } = await supabase
      .from('products')
      .select('normalized_brand')
      .not('normalized_brand', 'is', null)

    const uniqueBrands = brands ? 
      Array.from(new Set(brands.map(b => b.normalized_brand)))
      : []

    const brandPages: MetadataRoute.Sitemap = uniqueBrands.map(brand => ({
      url: `${baseUrl}/znacky/${generateSlug(brand)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...staticPages, ...productPages, ...categoryPages, ...brandPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}