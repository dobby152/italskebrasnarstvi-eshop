"use client"

export const dynamic = 'force-dynamic'
// Vercel deployment fix

import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Star, Heart, ShoppingCart, Filter, Grid, List, Search, X } from "lucide-react"

import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import dynamicImport from 'next/dynamic'
import Link from "next/link"

// Dynamically import Header to prevent SSR issues
const Header = dynamicImport(() => import("../components/header"), { ssr: false })
import { useProducts, useCollections, useBrands } from "../hooks/useProducts"
import { getImageUrl, getProductDisplayName, getProductDisplayCollection, transformProduct } from "../lib/api"
import { createProductSlug } from "../lib/utils"
import ColorVariantSelector from "../../components/color-variant-selector"
import { getAvailableCategories, filterProductsByCategory } from "../lib/product-categories"
import ProductFilterBar from "../components/product-filter-bar"

export default function ProduktyPage() {
  const searchParams = useSearchParams()
  const productTypeFromUrl = searchParams.get('productType')
  
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [] as string[],
    brands: [] as string[],
    priceRanges: [] as string[],
    features: [] as string[],
    productTypes: productTypeFromUrl ? [productTypeFromUrl] : [] as string[],
  })

  const [sortBy, setSortBy] = useState("popularity")
  const [viewMode, setViewMode] = useState("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  
  const priceRanges = [
    { label: "Do 3 000 Kč", min: 0, max: 3000 },
    { label: "3 000 - 7 000 Kč", min: 3000, max: 7000 },
    { label: "7 000 - 12 000 Kč", min: 7000, max: 12000 },
    { label: "Nad 12 000 Kč", min: 12000, max: Number.POSITIVE_INFINITY },
  ]
  
  // API hooks
  const { collections, loading: collectionsLoading, error: collectionsError } = useCollections()
  const { brands, loading: brandsLoading, error: brandsError } = useBrands()
  
  // Get current collection for filtering
  const selectedCollection = selectedFilters.categories.length > 0 && collections
    ? collections.find(c => c.id === selectedFilters.categories[0])
    : null
  
  const selectedBrand = selectedFilters.brands.length > 0 && brands
    ? brands.find(b => b.id.toString() === selectedFilters.brands[0])
    : null
  
  // Determine min and max price from selected price ranges
  const selectedPriceRange = selectedFilters.priceRanges.length > 0
    ? priceRanges.find(range => range.label === selectedFilters.priceRanges[0])
    : null;
  
  const { products, total, totalPages, loading: productsLoading, error: productsError, setPage, setSearch, setCollection, setBrand, setMinPrice, setMaxPrice, refetch } = useProducts({
    autoFetch: false  // Disable auto-fetch, we'll control it manually
  })

  // Debug: Log when products are loaded
  useEffect(() => {
    console.log('🔍 Products state:', { 
      productsCount: products?.length, 
      total, 
      loading: productsLoading, 
      error: productsError 
    })
  }, [products, total, productsLoading, productsError])

  const features = ["RFID ochrana", "USB port", "Voděodolný", "Antivražedný kabel", "Pravá kůže", "TSA zámek"]
  const productCategories = getAvailableCategories()

  // Apply local product type filtering
  let filteredProducts = products || []
  if (selectedFilters.productTypes.length > 0) {
    selectedFilters.productTypes.forEach(typeId => {
      filteredProducts = filterProductsByCategory(filteredProducts, typeId)
    })
  }

  const sortedProducts = filteredProducts
  
  console.log('🎯 Final sorted products:', sortedProducts?.length)
  
  // Update parameters and trigger refetch when filters change
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
    setPage(1)
    setSearch(searchQuery || '')
    setCollection(selectedCollection?.originalName || '')
    setBrand(selectedBrand?.name || '')
    setMinPrice(selectedPriceRange?.min)
    setMaxPrice(selectedPriceRange?.max !== Number.POSITIVE_INFINITY ? selectedPriceRange?.max : undefined)
    refetch()
  }, [selectedFilters, searchQuery, selectedCollection, selectedBrand, selectedPriceRange, setPage, setSearch, setCollection, setBrand, setMinPrice, setMaxPrice, refetch])
  
  // Update page when currentPage changes
  useEffect(() => {
    setPage(currentPage)
    refetch()
  }, [currentPage, setPage, refetch])
  
  // Initial load
  useEffect(() => {
    refetch()
  }, [])

  const toggleFilter = (type: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value) ? prev[type].filter((item) => item !== value) : [...prev[type], value],
    }))
  }

  const clearAllFilters = () => {
    setSelectedFilters({ categories: [] as string[], brands: [] as string[], priceRanges: [] as string[], features: [] as string[], productTypes: [] as string[] })
    setSearchQuery("")
  }

  const activeFiltersCount =
    selectedFilters.categories.length + selectedFilters.brands.length + selectedFilters.priceRanges.length + selectedFilters.features.length + selectedFilters.productTypes.length

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Header */}
      <div className="bg-gray-50 py-12 border-b">
        <div className="container mx-auto px-6">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-black">
              Domů
            </Link>
            <span className="mx-2">/</span>
            <span className="text-black font-medium">Produkty</span>
          </nav>

          <h1 className="text-4xl font-black text-gray-900 mb-4">Všechny produkty</h1>
          <p className="text-xl text-gray-600">Objevte naši kompletní kolekci italských kožených výrobků</p>

          {/* Search Bar */}
          <div className="mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Hledat produkty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-black"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <div className="lg:w-1/4">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 sticky top-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-gray-900 flex items-center">
                  <Filter className="h-6 w-6 mr-3" />
                  Filtry
                </h3>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    Vymazat ({activeFiltersCount})
                  </Button>
                )}
              </div>

              {/* Product Types */}
              <div className="mb-10">
                <h4 className="text-xl font-bold text-gray-900 mb-6">Typ produktu</h4>
                <div className="space-y-4">
                  {productCategories.map((category) => (
                    <label key={category.id} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedFilters.productTypes.includes(category.id)}
                        onChange={() => toggleFilter("productTypes", category.id)}
                        className="mr-4 w-5 h-5 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span className="text-lg text-gray-700 group-hover:text-black transition-colors font-medium">
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories/Collections */}
              <div className="mb-10">
                <h4 className="text-xl font-bold text-gray-900 mb-6">Kolekce</h4>
                <div className="space-y-4">
                  {collectionsLoading ? (
                    <div className="text-lg text-gray-500">Načítání...</div>
                  ) : (collections && Array.isArray(collections)) ? (
                    collections.map((collection) => (
                      <label key={collection.id} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFilters.categories.includes(collection.id)}
                          onChange={() => toggleFilter("categories", collection.id)}
                          className="mr-4 w-5 h-5 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <span className="text-lg text-gray-700 group-hover:text-black transition-colors font-medium">
                          {collection.name}
                          {collection.count && (
                            <span className="ml-2 text-sm text-gray-500">({collection.count})</span>
                          )}
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-lg text-red-500">Chyba při načítání kolekcí</div>
                  )}
                </div>
              </div>

              {/* Brands */}
              <div className="mb-10">
                <h4 className="text-xl font-bold text-gray-900 mb-6">Značky</h4>
                <div className="space-y-4">
                  {brandsLoading ? (
                    <div className="text-lg text-gray-500">Načítání...</div>
                  ) : (brands && Array.isArray(brands)) ? (
                    brands.map((brand) => (
                      <label key={brand.id} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFilters.brands.includes(brand.id.toString())}
                          onChange={() => toggleFilter("brands", brand.id.toString())}
                          className="mr-4 w-5 h-5 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <span className="text-lg text-gray-700 group-hover:text-black transition-colors font-medium">{brand.name}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-lg text-red-500">Chyba při načítání značek</div>
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-10">
                <h4 className="text-xl font-bold text-gray-900 mb-6">Cena</h4>
                <div className="space-y-4">
                  {priceRanges.map((range) => (
                    <label key={range.label} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedFilters.priceRanges.includes(range.label)}
                        onChange={() => toggleFilter("priceRanges", range.label)}
                        className="mr-4 w-5 h-5 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span className="text-lg text-gray-700 group-hover:text-black transition-colors font-medium">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="mb-10">
                <h4 className="text-xl font-bold text-gray-900 mb-6">Vlastnosti</h4>
                <div className="space-y-4">
                  {features.map((feature) => (
                    <label key={feature} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedFilters.features.includes(feature)}
                        onChange={() => toggleFilter("features", feature)}
                        className="mr-4 w-5 h-5 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span className="text-lg text-gray-700 group-hover:text-black transition-colors font-medium">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <p className="text-gray-600 text-lg">
                  Zobrazeno <span className="font-semibold">{products?.length || 0}</span> z{" "}
                  <span className="font-semibold">{total}</span> produktů
                </p>
                {searchQuery && (
                  <p className="text-sm text-gray-500 mt-1">
                    Výsledky pro: "<span className="font-medium">{searchQuery}</span>"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="popularity">Seřadit podle popularity</option>
                  <option value="price-low">Cena: od nejnižší</option>
                  <option value="price-high">Cena: od nejvyšší</option>
                  <option value="newest">Nejnovější</option>
                  
                </select>

                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-none ${viewMode === "grid" ? "bg-black text-white" : ""}`}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`rounded-none border-l ${viewMode === "list" ? "bg-black text-white" : ""}`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>


            {/* Products */}
            {productsLoading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-white shadow-lg">
                    <div className="w-full h-[300px] bg-gray-200 animate-pulse"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 animate-pulse mb-2"></div>
                      <div className="h-6 bg-gray-200 animate-pulse mb-4"></div>
                      <div className="h-8 bg-gray-200 animate-pulse"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : productsError ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Chyba při načítání produktů</h3>
                <p className="text-gray-600 mb-8">{productsError}</p>
              </div>
            ) : (!sortedProducts || sortedProducts.length === 0) ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Žádné produkty nenalezeny</h3>
                <p className="text-gray-600 mb-8">Zkuste upravit filtry nebo hledaný výraz</p>
                <Button onClick={clearAllFilters} className="bg-black hover:bg-gray-800 text-white">
                  Vymazat všechny filtry
                </Button>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-8" : "space-y-6"}>
                {sortedProducts?.map((product) => (
                  <Card
                    key={product.id}
                    className={`group bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-1 ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                      <img
                        src={product.images?.[0] || product.image_url || '/placeholder.svg'}
                        alt={getProductDisplayName(product)}
                        className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
                          viewMode === "list" ? "w-full h-48" : "w-full h-[300px]"
                        }`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder.svg'
                        }}
                      />

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {(product as any).originalPrice && (product as any).originalPrice > product.price && (
                          <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            Sleva
                          </div>
                        )}
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white shadow-lg"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>

                      {/* Savings display - only show if savings field exists */}
                      {(product as any).savings > 0 && (
                        <div className="absolute bottom-4 left-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          Ušetřete {(product as any).savings.toLocaleString()} Kč
                        </div>
                      )}
                    </div>

                    <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>


                      {/* Brand and Collection */}
                      <p className="text-sm text-gray-500 mb-2 font-medium">
                        {product.brand || 'Bez značky'} • {getProductDisplayCollection(product)}
                      </p>

                      {/* Product Name */}
                      <Link href={`/produkt/${createProductSlug(product)}`}>
                        <h3 className="font-bold text-lg mb-4 line-clamp-2 text-gray-900 leading-tight hover:text-gray-700 transition-colors cursor-pointer">
                          {getProductDisplayName(product)}
                        </h3>
                      </Link>

                      {/* Features */}
                      {product.features && product.features.length > 0 && (
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2">
                            {product.features.slice(0, 3).map((feature: string, index: number) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color Variants */}
                      <ColorVariantSelector product={product} />

                      {/* Price and Actions */}
                      <div className={`flex items-center justify-between ${viewMode === "list" ? "mt-auto" : ""}`}>
                        <div className="flex flex-col">
                          <span className="text-2xl font-black text-gray-900">{product.price.toLocaleString()} Kč</span>
                          {(product as any).originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {(product as any).originalPrice.toLocaleString()} Kč
                            </span>
                          )}
                        </div>
                        <Button
                          className="bg-black hover:bg-gray-800 text-white px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Koupit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-16">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    disabled={currentPage === 1}
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      setPage(newPage);
                    }}
                    className="border-gray-300 bg-transparent"
                  >
                    Předchozí
                  </Button>
                  
                  {/* Page numbers */}
                  {(() => {
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, startPage + 4);
                    const adjustedStartPage = Math.max(1, endPage - 4);
                    
                    return [...Array(endPage - adjustedStartPage + 1)].map((_, i) => {
                      const pageNum = adjustedStartPage + i;
                      return (
                        <Button 
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            setPage(pageNum);
                          }}
                          className={currentPage === pageNum ? "bg-black text-white" : "border-gray-300 hover:border-black bg-transparent"}
                        >
                          {pageNum}
                        </Button>
                      );
                    });
                  })()}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2">...</span>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setCurrentPage(totalPages);
                          setPage(totalPages);
                        }}
                        className="border-gray-300 hover:border-black bg-transparent"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    variant="outline" 
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      setPage(newPage);
                    }}
                    className="border-gray-300 hover:border-black bg-transparent"
                  >
                    Další
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
