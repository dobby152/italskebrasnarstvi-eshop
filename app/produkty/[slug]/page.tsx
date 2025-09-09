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
import Header from '@/app/components/header'
import { ProductVariantSelector } from '@/app/components/product-variant-selector'
import { ProductRecommendations } from '@/app/components/product-recommendations'

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
      
      <div className="min-h-screen bg-white">
        <Header />
        
        {/* Breadcrumbs */}
        <nav className="bg-gray-50 py-4">
          <div className="container mx-auto px-6">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <a href="/" className="text-gray-600 hover:text-gray-900">
                  Domů
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <a href="/produkty" className="text-gray-600 hover:text-gray-900">
                  Produkty
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <a 
                  href={`/kategorie/${generateSlug(product.collection_name)}`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {product.collection_name}
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">{product.name}</li>
            </ol>
          </div>
        </nav>

        {/* Product Content */}
        <main className="container mx-auto px-6 py-12">
          {/* Product Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.slice(1, 5).map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={image}
                        alt={`${product.name} ${index + 2}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <header>
                <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                  {product.normalized_brand}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <p className="text-2xl font-bold text-gray-900 mb-6">
                  {product.price.toLocaleString('cs-CZ')} Kč
                </p>
              </header>

              {/* Product Description */}
              <div className="prose prose-gray max-w-none">
                <p>{product.description}</p>
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    product.availability > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`font-medium ${
                    product.availability > 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {product.availability > 0 ? 'Skladem' : 'Vyprodáno'}
                  </span>
                </div>
                
                {/* Store Availability */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Dostupnost v prodejnách</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-700">Prodejna Chodov</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">Skladem</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-700">Outlet Štěrboholy</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">Skladem</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Aktuální dostupnost v prodejnách. Pro rezervaci kontaktujte příslušnou prodejnu.
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Variants */}
              <ProductVariantSelector 
                variants={[]}
                onVariantChange={() => {}}
                basePrice={product.price}
              />

              {/* Add to Cart */}
              <div className="flex gap-4">
                <button 
                  className="flex-1 bg-black text-white py-4 px-8 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={product.availability <= 0}
                >
                  {product.availability > 0 ? 'Přidat do košíku' : 'Vyprodáno'}
                </button>
              </div>
            </div>
          </section>

          {/* Product Details */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Detaily produktu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Specifikace</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">SKU:</dt>
                    <dd className="font-medium">{product.sku}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Značka:</dt>
                    <dd className="font-medium">{product.normalized_brand}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Kategorie:</dt>
                    <dd className="font-medium">{product.collection_name}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Doprava a vrácení</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Doprava zdarma nad 2 000 Kč</li>
                  <li>• Doručení do 2-3 pracovních dní</li>
                  <li>• 30 dní na vrácení zboží</li>
                  <li>• Záruka 2 roky</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Related Products */}
          <section>
            <ProductRecommendations 
              type="similar"
              productId={product.id.toString()}
              limit={4}
            />
          </section>
        </main>
      </div>
    </>
  )
}