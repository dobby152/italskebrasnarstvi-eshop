'use client'

import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
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

interface ProductPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

interface StockInfo {
  sku: string
  locations: Array<{
    name: string
    stock: number
    available: number
  }>
  totalStock: number
  available: number
  lastUpdated: string
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

function ProductPageClient({ initialProduct, slug }: { initialProduct: Product, slug: string }) {
  const [product, setProduct] = useState<Product>(initialProduct)
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  // Fetch real-time stock data
  useEffect(() => {
    fetchStockData()
  }, [product.sku])

  const fetchStockData = async () => {
    try {
      const response = await fetch(`/api/stock/${encodeURIComponent(product.sku)}`)
      if (response.ok) {
        const data = await response.json()
        setStockInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch stock data:', error)
    }
  }

  const handleAddToCart = async () => {
    setAddingToCart(true)
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': generateSessionId()
        },
        body: JSON.stringify({
          productVariantId: product.id,
          quantity: 1
        })
      })
      
      if (response.ok) {
        // Show success message
        alert('Produkt byl přidán do košíku!')
      } else {
        throw new Error('Failed to add to cart')
      }
    } catch (error) {
      console.error('Add to cart error:', error)
      alert('Chyba při přidávání do košíku')
    }
    setAddingToCart(false)
  }

  const generateSessionId = () => {
    let sessionId = localStorage.getItem('session-id')
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('session-id', sessionId)
    }
    return sessionId
  }

  // Use real stock data if available, otherwise fallback to product.availability
  const currentStock = stockInfo ? stockInfo.totalStock : product.availability
  const isAvailable = currentStock > 0


export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  return <ProductPageClient initialProduct={product} slug={slug} />
}

  return (
    <ProductPageContent 
      product={product}
      stockInfo={stockInfo}
      currentStock={currentStock}
      isAvailable={isAvailable}
      handleAddToCart={handleAddToCart}
      addingToCart={addingToCart}
      slug={slug}
    />
  )
}

function ProductPageContent({ product, stockInfo, currentStock, isAvailable, handleAddToCart, addingToCart, slug }: {
  product: Product
  stockInfo: StockInfo | null
  currentStock: number
  isAvailable: boolean
  handleAddToCart: () => void
  addingToCart: boolean
  slug: string
}) {

  // Generate structured data
  const productJsonLd = generateProductJsonLd({
    name: product.name,
    price: product.price,
    currency: 'CZK',
    availability: isAvailable ? 'in_stock' : 'out_of_stock',
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
        <main className="container mx-auto px-6 py-8">
          {/* Product Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="eager"
                />
                {/* Premium Badge */}
                <div className="absolute top-4 left-4">
                  <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                    ✨ Italská kvalita
                  </div>
                </div>
                {/* Discount Badge if needed */}
                {product.price < 5000 && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      AKCE
                    </div>
                  </div>
                )}
              </div>
              
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.slice(1, 5).map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <img 
                        src={image}
                        alt={`${product.name} ${index + 2}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <header className="border-b border-gray-100 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-600 uppercase tracking-widest font-medium">
                    {product.normalized_brand}
                  </span>
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-sm text-gray-600 ml-2">(12 hodnocení)</span>
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {product.price.toLocaleString('cs-CZ')} Kč
                  </div>
                  {product.price > 3000 && (
                    <div className="text-lg text-gray-500 line-through">
                      {Math.round(product.price * 1.2).toLocaleString('cs-CZ')} Kč
                    </div>
                  )}
                </div>
                <p className="text-green-600 font-medium text-sm mt-2">
                  🚚 Doprava zdarma nad 2 000 Kč
                </p>
              </header>

              {/* Product Description */}
              <div className="prose prose-gray max-w-none">
                <p>{product.description}</p>
              </div>

              {/* Availability */}
              <div className="space-y-4">
                {/* Stock Count */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-900">Dostupnost</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isAvailable ? `${currentStock} ks skladem` : 'Vyprodáno'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      isAvailable ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-sm ${
                      isAvailable ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isAvailable ? 'Ihned k expedici' : 'Momentálně nedostupné'}
                    </span>
                  </div>
                  {stockInfo && (
                    <div className="mt-3 text-xs text-blue-600">
                      Poslední aktualizace: {new Date(stockInfo.lastUpdated).toLocaleString('cs-CZ')}
                    </div>
                  )}
                </div>
                
                {/* Store Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Naše prodejny
                  </h4>
                  
                  <div className="space-y-4">
                    {stockInfo?.locations.map((location, index) => {
                      const isChodovas = location.name.toLowerCase().includes('chodov')
                      return (
                        <div key={index} className={`border-l-4 ${isChodovas ? 'border-blue-500' : 'border-orange-500'} pl-4`}>
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-medium text-gray-900">{location.name}</h5>
                            <span className={`text-sm font-medium ${
                              location.available > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {location.available > 0 ? `${location.available} ks` : 'Vyprodáno'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{isChodovas ? 'Roztylská 2321/19, Praha 11 - Chodov' : 'Nákupní park Štěrboholy, Praha 10'}</p>
                            <p>{isChodovas ? 'Po-Pá: 9:00-20:00, So-Ne: 9:00-18:00' : 'Po-Ne: 9:00-21:00'}</p>
                            <p className="font-medium text-green-600">📞 {isChodovas ? '+420 234 567 890' : '+420 234 567 891'}</p>
                            {!isChodovas && <p className="text-xs text-orange-600 font-medium">OUTLET CENY</p>}
                          </div>
                        </div>
                      )
                    }) || (
                      // Fallback when no stock data
                      <>
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h5 className="font-medium text-gray-900">Prodejna Chodov</h5>
                          <div className="text-sm text-gray-600 space-y-1 mt-1">
                            <p>Roztylská 2321/19, Praha 11 - Chodov</p>
                            <p>Po-Pá: 9:00-20:00, So-Ne: 9:00-18:00</p>
                            <p className="font-medium text-green-600">📞 +420 234 567 890</p>
                          </div>
                        </div>
                        
                        <div className="border-l-4 border-orange-500 pl-4">
                          <h5 className="font-medium text-gray-900">Outlet Štěrboholy</h5>
                          <div className="text-sm text-gray-600 space-y-1 mt-1">
                            <p>Nákupní park Štěrboholy, Praha 10</p>
                            <p>Po-Ne: 9:00-21:00</p>
                            <p className="font-medium text-green-600">📞 +420 234 567 891</p>
                            <p className="text-xs text-orange-600 font-medium">OUTLET CENY</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">
                      💡 Tip: Rezervujte si zboží telefonicky před návštěvou prodejny
                    </p>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        ✓ Osobní odběr zdarma
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        ✓ Možnost vrácení
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Variants */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Varianty</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <button className="w-full p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <div className="text-sm font-medium text-gray-900">Standardní</div>
                      <div className="text-xs text-gray-500">Skladem</div>
                    </button>
                  </div>
                  <div className="text-center">
                    <button className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed opacity-50">
                      <div className="text-sm font-medium text-gray-500">Premium</div>
                      <div className="text-xs text-gray-400">Brzy</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    disabled={!isAvailable || addingToCart}
                    onClick={handleAddToCart}
                  >
                    {addingToCart ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Přidávám...
                      </span>
                    ) : isAvailable ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5L17 8" />
                        </svg>
                        Přidat do košíku
                      </span>
                    ) : 'Vyprodáno'}
                  </button>
                  
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-4 rounded-xl transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                {isAvailable && (
                  <div className="flex gap-2 text-sm">
                    <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                      Koupit na splátky
                    </button>
                    <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                      Rezervovat v prodejně
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Product Details */}
          <section className="mb-12">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Detaily produktu</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
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
            </div>
          </section>

          {/* Customer Service */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Potřebujete pomoc?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Telefonická podpora</h3>
                <p className="text-sm text-gray-600 mb-2">Po-Pá: 9:00-17:00</p>
                <p className="font-medium text-blue-600">+420 800 123 456</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email podpora</h3>
                <p className="text-sm text-gray-600 mb-2">Odpovíme do 24 hodin</p>
                <p className="font-medium text-green-600">info@italskebrasnarstvi.cz</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Live chat</h3>
                <p className="text-sm text-gray-600 mb-2">Rychlá pomoc online</p>
                <button className="font-medium text-purple-600 hover:text-purple-700">Spustit chat</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}