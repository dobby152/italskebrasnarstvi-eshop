"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Star, Heart, ShoppingCart, Search, X, Filter, Grid, List } from "lucide-react"
import Link from "next/link"
import { useProducts, useCollections } from "../hooks/useProducts"
import { getImageUrl } from "../lib/utils";
import { ProductTagList, type Tag } from "./ui/product-tag"
import ColorSelector from "./color-selector"
import { VariantAttributeOption } from "../lib/types/variants"

export default function ProductsSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popularity")
  const [viewMode, setViewMode] = useState("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // API hooks
  const { products, totalPages, loading, error, setPage, setSearch, setCollection } = useProducts({
    page: currentPage,
    limit: 24,
    search: searchQuery,
    collection: selectedCategory === "all" ? undefined : selectedCategory,
    sortBy: 'id',
    sortOrder: 'asc',
    autoFetch: true
  })
  
  const { collections } = useCollections()
  
  const categories = collections || []

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "newest":
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      
      case "name":
        return (a.name || '').localeCompare(b.name || '')
      default:
        return 0
    }
  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
    setPage(1)
  }, [searchQuery, selectedCategory, setPage])

  // Update hook when local state changes
  useEffect(() => {
    setSearch(searchQuery)
  }, [searchQuery, setSearch])

  useEffect(() => {
    setCollection(selectedCategory === "all" ? "" : selectedCategory)
  }, [selectedCategory, setCollection])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
  }

  const hasActiveFilters = searchQuery || selectedCategory !== "all"

  // Extract available colors from products
  const getAvailableColors = (product: any): VariantAttributeOption[] => {
    // Check if product has color variants data
    if (product.colorCode && product.colorName && product.hexColor) {
      return [{
        value: product.colorCode,
        displayValue: product.colorName,
        hexColor: product.hexColor,
        available: product.availability === 'Skladem',
        price: product.price
      }]
    }
    
    // Fallback to using colors array if available
    if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors.map((color: string, index: number) => ({
        value: `color-${index}`,
        displayValue: 'Barva',
        hexColor: color,
        available: product.availability === 'Skladem',
        price: product.price
      }))
    }
    
    return []
  }

  return (
    <div className="space-y-8">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row gap-4 items-center mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
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

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48 bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black">
              <SelectValue placeholder="Všechny kategorie" />
            </SelectTrigger>
            <SelectContent className="z-10 bg-white shadow-md rounded-md">
              <SelectItem value="all" className="hover:bg-gray-100 px-3 py-2 cursor-pointer">
                Všechny kategorie
              </SelectItem>
              {categories.map((category: any) => (
                <SelectItem
                  key={category.id}
                  value={category.id}
                  className="hover:bg-gray-100 px-3 py-2 cursor-pointer text-lg font-semibold"
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Nejoblíbenější</SelectItem>
              <SelectItem value="newest">Nejnovější</SelectItem>
              <SelectItem value="price-low">Cena: nejnižší</SelectItem>
              <SelectItem value="price-high">Cena: nejvyšší</SelectItem>
              <SelectItem value="name">Název A-Z</SelectItem>
              
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-black text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-black text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="whitespace-nowrap"
            >
              Vymazat filtry
            </Button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          {loading ? "Načítání..." : `Zobrazeno ${products.length} produktů`}
          {searchQuery && ` pro "${searchQuery}"`}
          {selectedCategory && selectedCategory !== "all" && (() => {
            const category = categories.find((cat: any) => cat.id === selectedCategory)
            return ` v kategorii "${category?.name || selectedCategory}"`
          })()}
        </p>
        <Link href="/produkty">
          <Button variant="outline" className="hover:bg-black hover:text-white">
            Zobrazit všechny produkty
          </Button>
        </Link>
      </div>

      {/* Products Grid/List */}
      {loading ? (
        <div className={`grid gap-6 ${
          viewMode === "grid" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1"
        }`}>
          {[...Array(12)].map((_, index) => (
            <Card key={index} className="bg-white shadow-lg animate-pulse">
              <div className="h-[250px] bg-gray-200"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Chyba při načítání produktů: {error}</p>
          <Button onClick={() => window.location.reload()}>Zkusit znovu</Button>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Žádné produkty nenalezeny</p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline">
              Vymazat filtry
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          }`}>
            {sortedProducts.map((product) => {
              const availableColors = getAvailableColors(product)
              
              return (
                <Card key={product.id} className={`group bg-white shadow-lg hover:shadow-xl transition-all duration-300 ${
                  viewMode === "list" ? "flex flex-row" : ""
                }`}>
                  <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                    <div className="image-gallery relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name || 'Produkt'}
                          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                            viewMode === "list" ? "w-full h-full" : "w-full h-[250px]"
                          }`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : product.images && product.images.length > 0 ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name || 'Produkt'}
                          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                            viewMode === "list" ? "w-full h-full" : "w-full h-[250px]"
                          }`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className={`bg-gray-200 flex items-center justify-center ${
                          viewMode === "list" ? "w-full h-full" : "w-full h-[250px]"
                        }`}>
                          <span className="text-gray-500">Bez obrázku</span>
                        </div>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" className="absolute top-3 right-3 bg-white/80">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-gray-300"
                        />
                      ))}
                      
                    </div>
                    <h3 className="font-bold text-lg mb-3 line-clamp-2">{product.name_cz || product.name || 'Neznámý produkt'}</h3>
                    <p className="text-gray-600 mb-2">
                      {product.brand || 'Bez Značky'}
                    </p>
                    
                    {/* Product Tags */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="mb-3">
                        <ProductTagList
                          tags={product.tags}
                          maxTags={viewMode === "list" ? 5 : 3}
                          size="sm"
                          variant="outline"
                          onTagClick={(tag) => {
                            // Handle tag click - could filter products by tag
                            console.log('Tag clicked:', tag);
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Color Selector for Variants */}
                    {availableColors.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Dostupné barvy:</p>
                        <div className="flex items-center gap-2">
                          <ColorSelector
                            colors={availableColors}
                            onColorChange={(color) => console.log('Color selected:', color)}
                          />
                          {product.hasVariants && (
                            <span className="text-xs text-gray-500">
                              {product.variantCount || availableColors.length} barevn{
                                (product.variantCount || availableColors.length) === 1 ? 'á varianta' :
                                (product.variantCount || availableColors.length) < 5 ? 'é varianty' : 'ých variant'
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {(product.description_cz || product.description) && viewMode === "list" && (
                      <p className="text-gray-600 mb-4 line-clamp-2">{product.description_cz || product.description}</p>
                    )}
                    <div className={`flex items-center ${
                      viewMode === "list" ? "justify-between" : "justify-between"
                    }`}>
                      <div>
                        <span className="text-xl font-black">{product.price?.toLocaleString('cs-CZ')} Kč</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            {product.originalPrice.toLocaleString('cs-CZ')} Kč
                          </span>
                        )}
                      </div>
                      {product.stockStatus && (
                        <div className="mt-2 text-gray-600">
                          {product.stockStatus === "in_stock" && (
                            <span>Je skladem ({product.stockCount} kusů)</span>
                          )}
                          {product.stockStatus === "in_partner_stock" && (
                            <span>Skladem na partnerské prodejně</span>
                          )}
                          {product.stockStatus === "out_of_stock" && (
                            <span>Není skladem</span>
                          )}
                          {product.stockStatus === "with_supplier" && (
                            <span>Skladem u dodavatele</span>
                          )}
                          {product.stockStatus === "on_order" && (
                            <span>Na objednávku</span>
                          )}
                        </div>
                      )}
                      <Button className="bg-black hover:bg-gray-800 text-white px-4 py-2">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Koupit
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1)
                  setCurrentPage(newPage)
                  setPage(newPage)
                }}
                disabled={currentPage === 1}
              >
                Předchozí
              </Button>
              
              <div className="flex space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(pageNum)
                        setPage(pageNum)
                      }}
                      className={currentPage === pageNum ? "bg-black text-white" : ""}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2">...</span>
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(totalPages)
                        setPage(totalPages)
                      }}
                      className={currentPage === totalPages ? "bg-black text-white" : ""}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  const newPage = Math.min(totalPages, currentPage + 1)
                  setCurrentPage(newPage)
                  setPage(newPage)
                }}
                disabled={currentPage === totalPages}
              >
                Další
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}