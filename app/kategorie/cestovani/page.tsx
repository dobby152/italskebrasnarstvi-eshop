"use client"

import { useState } from 'react'
import { useCollections, useBrands } from '../../hooks/useProducts'
import ProductGrid from '../../components/product-grid'
import ProductFilters from '../../components/product-filters'
import { Button } from "../../components/ui/button"
import { SlidersHorizontal, X } from "lucide-react"
import Link from "next/link"

export default function CestovaniPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<any>(null)
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Travel category search terms
  const travelTerms = ['kufr', 'trolley', 'cestovni', 'travel', 'zavazadlo', 'kosmetick', 'backpack', 'batoh']
  const travelSearchQuery = travelTerms.join(' OR ')

  const { collections } = useCollections()
  const { brands } = useBrands()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-black transition-colors">Domů</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Cestování</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Cestovní kolekce
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Kufry, cestovní tašky a batohy pro vaše dobrodružství. 
              Odolné materiály, promyšlené detaily a elegantní design pro každou cestu.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="px-3 py-1 bg-white/20 rounded-full">✈️ Kabinové zavazadlo</span>
              <span className="px-3 py-1 bg-white/20 rounded-full">🧳 TSA zámky</span>
              <span className="px-3 py-1 bg-white/20 rounded-full">💧 Voděodolné</span>
              <span className="px-3 py-1 bg-white/20 rounded-full">⚡ Rychlý přístup</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b sticky top-[72px] z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex space-x-6 overflow-x-auto">
              <Link href="/kategorie/kufry" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Kufry a trolley
              </Link>
              <Link href="/kategorie/cestovni-tasky" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Cestovní tašky
              </Link>
              <Link href="/kategorie/cestovni-batohy" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Cestovní batohy
              </Link>
              <Link href="/kategorie/kosmeticke-tasky" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Kosmetické tašky
              </Link>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0 ml-4"
            >
              {showFilters ? <X className="h-4 w-4 mr-2" /> : <SlidersHorizontal className="h-4 w-4 mr-2" />}
              Filtry
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 shrink-0">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <ProductFilters
                  filters={{
                    brand: selectedBrand ? [selectedBrand] : [],
                    search: searchQuery || '',
                    category: selectedCollection ? [selectedCollection] : []
                  }}
                  onFiltersChange={(filters) => {
                    setSelectedBrand(filters.brand?.[0] || '')
                    setSearchQuery(filters.search || '')
                    setSelectedCollection(filters.category?.[0] || '')
                  }}
                  onClearFilters={() => {
                    setSelectedBrand('')
                    setSearchQuery('')
                    setSelectedCollection('')
                  }}
                  brands={brands.map(brand => brand.name)}
                />
              </div>
            </div>
          )}

          {/* Products */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Cestovní produkty
                </h2>
                <p className="text-gray-600 mt-1">
                  Produkty pro cestování a dovolenou
                </p>
              </div>
            </div>

            {/* Product Grid */}
            <ProductGrid
              category="cestovani"
              searchQuery={travelSearchQuery}
              limit={20}
            />
          </div>
        </div>
      </div>
    </div>
  )
}