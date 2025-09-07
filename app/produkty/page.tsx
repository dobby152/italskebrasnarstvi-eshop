"use client"

export const dynamic = 'force-dynamic'

import { useState, useCallback } from "react"
import { Input } from "../components/ui/input"
import { Search, X } from "lucide-react"
import dynamicImport from 'next/dynamic'
import Link from "next/link"

// Dynamically import Header to prevent SSR issues
const Header = dynamicImport(() => import("../components/header"), { ssr: false })
import ProductFiltersSidebar from "../../components/product-filters-sidebar"
import { ProductGrid } from "../../components/product-grid"

export default function ProduktyPage() {
  const [filterParams, setFilterParams] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleFiltersChange = useCallback((filters: any) => {
    const params = new URLSearchParams()
    
    if (filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','))
    }
    if (filters.brands.length > 0) {
      params.append('brand', filters.brands[0])
    }
    if (filters.inStock) {
      params.append('inStockOnly', 'true')
    }
    if (filters.priceMin > 0) {
      params.append('minPrice', filters.priceMin.toString())
    }
    if (filters.priceMax < 50000) {
      params.append('maxPrice', filters.priceMax.toString())
    }
    if (searchQuery) {
      params.append('search', searchQuery)
    }
    
    setFilterParams(params.toString())
  }, [searchQuery])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    // Trigger filter update to include search
    const params = new URLSearchParams(filterParams)
    if (query) {
      params.set('search', query)
    } else {
      params.delete('search')
    }
    setFilterParams(params.toString())
  }

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
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 border-gray-300 focus:border-black"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
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
            <ProductFiltersSidebar onFiltersChange={handleFiltersChange} />
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            <ProductGrid 
              searchQuery={searchQuery}
              limit={12}
              categories={new URLSearchParams(filterParams).get('categories') || undefined}
              brand={new URLSearchParams(filterParams).get('brand') || undefined}
              minPrice={new URLSearchParams(filterParams).get('minPrice') || undefined}
              maxPrice={new URLSearchParams(filterParams).get('maxPrice') || undefined}
              inStockOnly={new URLSearchParams(filterParams).get('inStockOnly') || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  )
}