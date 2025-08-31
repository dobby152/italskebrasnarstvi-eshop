"use client"

// Disable static generation for product page since it uses useCart hook
export const dynamic = 'force-dynamic'

import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Heart, ShoppingCart, Star, Minus, Plus, Shield, Truck, RotateCcw, Check } from "lucide-react"
import { useState, useEffect, use, useRef } from "react"
import dynamicImport from 'next/dynamic'

// Dynamically import Header to prevent SSR issues
const Header = dynamicImport(() => import("../../components/header"), { ssr: false })
import Link from "next/link"
import { useProduct } from "../../hooks/useProducts"
import { formatPrice, getImageUrl, getProductDisplayName, getProductDisplayCollection, getProductDisplayDescription } from "../../lib/utils"
import ProductVariantSelector from "../../components/product-variant-selector"
import { useVariants } from "../../hooks/useVariants"
import VariantImageGallery from "../../components/variant-image-gallery"
import { useCart } from "../../context/cart-context"
import { ProductVariant } from "../../lib/types/variants"

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  console.log('ProductDetailPage: resolvedParams.slug:', resolvedParams.slug)
  const { product, loading, error } = useProduct(resolvedParams.slug)
  console.log('ProductDetailPage: useProduct result:', { product: !!product, loading, error })
  const { variantGroup, selectedVariant, setSelectedVariant, loading: variantsLoading, error: variantsError, fetchVariantGroup } = useVariants()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("popis")
  const [selectedColorVariant, setSelectedColorVariant] = useState<any>(null)
  const lastFetchedSkuRef = useRef<string | null>(null)

  // Fetch variant data when product is loaded
  useEffect(() => {
    if (product && product.sku) {
      // Use baseSku from product if available, otherwise extract from SKU
      const baseSku = (product as any).baseSku || (product.sku.includes('-') ? product.sku.split('-')[0] : product.sku)
      
      // Only fetch if we haven't already fetched for this SKU
      if (lastFetchedSkuRef.current !== baseSku) {
        lastFetchedSkuRef.current = baseSku
        fetchVariantGroup(baseSku)
      }
    }
  }, [product?.sku])

  const handleAddToCart = () => {
    if (selectedVariant) {
      // Use existing product variant system
      addItem(selectedVariant, quantity)
    } else if (selectedColorVariant) {
      // Use selected color variant
      const colorVariant: any = {
        id: selectedColorVariant.id,
        base_product_id: product?.id,
        sku: selectedColorVariant.sku,
        name: selectedColorVariant.name,
        price: selectedColorVariant.price,
        inventory_quantity: selectedColorVariant.stock || 10,
        inventory_policy: 'deny',
        status: 'active',
        availability: selectedColorVariant.availability,
        attributes: {
          color: selectedColorVariant.colorName,
          hexColor: selectedColorVariant.hexColor,
          colorCode: selectedColorVariant.colorCode
        },
        images: selectedColorVariant.images ? selectedColorVariant.images.map((img: string) => ({ image_url: img })) : [],
        requires_shipping: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      addItem(colorVariant, quantity)
    } else if (product) {
      // Fallback: Create a variant from the current product
      const mockVariant: any = {
        id: product.id,
        base_product_id: product.id,
        sku: product.sku,
        name: getProductDisplayName(product),
        price: product.price,
        inventory_quantity: product.stock || 10,
        inventory_policy: 'deny',
        status: 'active',
        availability: product.availability,
        attributes: {
          color: (product as any).colorName || 'Výchozí barva',
          hexColor: (product as any).hexColor || '#CCCCCC',
          colorCode: (product as any).colorCode || 'DEFAULT'
        },
        images: product.images ? product.images.map((img: string) => ({ image_url: img })) : [],
        requires_shipping: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      addItem(mockVariant, quantity)
    }
  }

  if (loading || variantsLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-6 py-20">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-2 gap-16">
              <div className="space-y-6">
                <div className="bg-gray-200 rounded-2xl h-[600px]"></div>
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-8">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-2/3"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || variantsError) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Chyba při načítání</h1>
          <p className="text-gray-600 mb-8">Nepodařilo se načíst detail produktu. Zkuste to prosím znovu.</p>
          <Link href="/produkty">
            <Button className="bg-black hover:bg-gray-800 text-white">Zpět na produkty</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Produkt nenalezen</h1>
          <p className="text-gray-600 mb-8">Omlouváme se, ale hledaný produkt neexistuje.</p>
          <Link href="/produkty">
            <Button className="bg-black hover:bg-gray-800 text-white">Zpět na produkty</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Use selected variant price, color variant price, or fallback to product price
  const displayPrice = selectedVariant ? selectedVariant.price : 
                       selectedColorVariant ? selectedColorVariant.price : 
                       product.price

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container mx-auto px-6">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-black">
              Domů
            </Link>
            <span className="mx-2">/</span>
            <Link href="/produkty" className="hover:text-black">
              Produkty
            </Link>
            <span className="mx-2">/</span>
            {product && getProductDisplayCollection(product) && (
              <>
                <span className="hover:text-black">
                  {getProductDisplayCollection(product)}
                </span>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-black font-medium">
              {product ? getProductDisplayName(product) : resolvedParams.slug}
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Product Images */}
          <VariantImageGallery
            selectedVariant={selectedVariant}
            baseImages={product.images || []}
            productName={getProductDisplayName(product)}
          />

          {/* Product Info */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">SKU: {product.sku}</span>
            </div>

            {/* Brand and Title */}
            <div>
              <p className="text-lg text-gray-600 font-medium mb-2">{product.brand || 'Bez značky'}</p>
              <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">{getProductDisplayName(product)}</h1>
              <p className="text-xl text-gray-700 leading-relaxed">{getProductDisplayDescription(product)}</p>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Klíčové vlastnosti</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Array.isArray(product.features) && product.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-gray-700 font-medium">{feature.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variant Selector */}
            {variantGroup && variantGroup.variants.length > 1 && (
              <div>
                <ProductVariantSelector
                  variants={variantGroup.variants}
                  selectedVariantId={selectedVariant?.id.toString()}
                  onVariantChange={setSelectedVariant}
                  basePrice={product.price}
                />
              </div>
            )}


            {/* Price and Stock */}
            <div className="bg-gray-50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-4xl font-black text-gray-900">{formatPrice(displayPrice)}</span>
                    {/* Original price handling - only show if originalPrice exists and is different from current price */}
                    {(product as any).originalPrice && (product as any).originalPrice > product.price && (
                      <>
                        <span className="text-xl text-gray-500 line-through">{formatPrice((product as any).originalPrice)}</span>
                        <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                          -{Math.round((((product as any).originalPrice - product.price) / (product as any).originalPrice) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${product.availability === 'in_stock' ? "text-green-600" : "text-red-600"}`}>
                    {product.availability === 'in_stock' ? `Skladem` : "Není skladem"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Doprava zdarma nad 2.500 Kč</div>
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="flex gap-4 mb-6">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-6 py-3 font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  disabled={product.availability !== 'in_stock'}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Přidat do košíku
                </Button>
              </div>

              {/* Service Icons */}
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="flex flex-col items-center gap-2">
                  <Truck className="h-6 w-6 text-gray-600" />
                  <span className="text-gray-700 font-medium">Rychlé doručení</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <RotateCcw className="h-6 w-6 text-gray-600" />
                  <span className="text-gray-700 font-medium">Vrácení zdarma</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Shield className="h-6 w-6 text-gray-600" />
                  <span className="text-gray-700 font-medium">2 roky záruka</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-20">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: "popis", label: "Popis produktu" },
                { id: "specifikace", label: "Specifikace" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-lg transition-colors ${
                    activeTab === tab.id
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-12">
            {activeTab === "popis" && (
              <div className="prose prose-xl max-w-none">
                <p className="text-xl text-gray-700 leading-relaxed mb-8">
                  {getProductDisplayDescription(product) || `Objevte ${getProductDisplayName(product)} z kolekce ${getProductDisplayCollection(product)}. Tento produkt kombinuje italské řemeslné umění s moderními technologiemi pro vytvoření dokonalého společníka pro každodenní použití.`}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Proč si vybrat tento produkt?</h3>
                <ul className="space-y-4 text-lg text-gray-700">
                  <li className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-600 mt-0.5" />
                    <span>
                      <strong>Prémiová kvalita:</strong> Vyrobeno z nejkvalitnějších materiálů s důrazem na detail
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-600 mt-0.5" />
                    <span>
                      <strong>Italské řemeslo:</strong> Tradiční techniky zpracování s moderním designem
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-600 mt-0.5" />
                    <span>
                      <strong>Funkčnost:</strong> Promyšlený design pro maximální komfort a praktičnost
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-600 mt-0.5" />
                    <span>
                      <strong>Trvanlivost:</strong> Odolné materiály a kvalitní zpracování pro dlouhodobé použití
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "specifikace" && (
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Technické specifikace</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">SKU:</span>
                      <span className="text-gray-900 font-semibold">{product.sku}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Značka:</span>
                      <span className="text-gray-900 font-semibold">{product.brand || 'Bez značky'}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Kolekce:</span>
                      <span className="text-gray-900 font-semibold">{getProductDisplayCollection(product) || 'Základní kolekce'}</span>
                    </div>
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex justify-between py-3 border-b border-gray-200">
                        <span className="font-medium text-gray-700">Barva:</span>
                        <span className="text-gray-900 font-semibold">{product.colors.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Dostupnost:</span>
                      <span className={`font-semibold ${
                        product.availability === 'in_stock' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.availability === 'in_stock' ? 'Skladem' : 'Není skladem'}
                      </span>
                    </div>
                    {product.features && (
                      <div className="flex justify-between py-3 border-b border-gray-200">
                        <span className="font-medium text-gray-700">Vlastnosti:</span>
                        <div className="space-y-2">
                          {Array.isArray(product.features) && product.features.map((feature: string, index: number) => {
                            const isBoldFeature = ["doprava zdarma", "český zákaznický servis", "garance nejlepší ceny"].includes(feature.toLowerCase().trim());
                            return (
                              <div key={index} className="flex items-center gap-3">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className={`text-gray-900 ${isBoldFeature ? 'font-bold' : 'font-semibold'}`}>{feature.trim()}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Péče o produkt</h3>
                  <div className="space-y-4 text-gray-700">
                    <p>• Čištění vlhkým hadříkem</p>
                    <p>• Nepoužívat agresivní čisticí prostředky</p>
                    <p>• Sušit při pokojové teplotě</p>
                    <p>• Chránit před přímým slunečním světlem</p>
                    <p>• Pravidelně ošetřovat kožené části</p>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Related Products - TODO: Implement when API supports related products */}
        {/* <div className="mt-20">
          <h2 className="text-4xl font-black text-gray-900 mb-12 text-center">Podobné produkty</h2>
          <div className="grid md:grid-cols-3 gap-8">
            Related products will be implemented when API supports this feature
          </div>
        </div> */}
      </div>
    </div>
  )
}
