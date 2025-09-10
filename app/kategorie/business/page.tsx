"use client"

import { useState } from 'react'
import { useCollections, useBrands } from '../../../hooks/useProducts'
import { ProductGrid } from '../../../components/product-grid'
import ProductFilters from '../../../components/product-filters'
import { Button } from "../../../components/ui/button"
import { SlidersHorizontal, X } from "lucide-react"
import Link from "next/link"

export default function BusinessPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])

  // Business category search terms
  const businessTerms = ['aktovka', 'business', 'notebook', 'laptop', 'teczka', 'skorzana', 'briefcase', 'messenger', 'work', 'office']
  const businessSearchQuery = businessTerms.join(' OR ')

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
            <span className="text-gray-900 font-medium">Business</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Business kolekce
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Elegantní aktovky, notebook tašky a business batohy pro moderního profesionála. 
              Vyrobeno z prémiové italské kůže s důrazem na funkčnost a styl.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="px-3 py-1 bg-white/20 rounded-full">✓ Laptop kompatibilní</span>
              <span className="px-3 py-1 bg-white/20 rounded-full">✓ Organizační systém</span>
              <span className="px-3 py-1 bg-white/20 rounded-full">✓ Prémiová kůže</span>
              <span className="px-3 py-1 bg-white/20 rounded-full">✓ Profesionální design</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b sticky top-[72px] z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex space-x-6 overflow-x-auto">
              <Link href="/kategorie/aktoky" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Aktovky
              </Link>
              <Link href="/kategorie/notebook-tasky" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Notebook tašky
              </Link>
              <Link href="/kategorie/business-batohy" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Business batohy
              </Link>
              <Link href="/kategorie/messenger" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Messenger tašky
              </Link>
              <Link href="/kategorie/organizery" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Organizéry
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
                    category: selectedCollection || undefined,
                    colors: selectedColors
                  }}
                  onFiltersChange={(filters) => {
                    setSelectedBrand(filters.brand?.[0] || '')
                    setSearchQuery(filters.search || '')
                    setSelectedCollection(filters.category || '')
                    setSelectedColors(filters.colors || [])
                  }}
                  onClearFilters={() => {
                    setSelectedBrand('')
                    setSearchQuery('')
                    setSelectedCollection('')
                    setSelectedColors([])
                  }}
                  brands={brands?.map(brand => brand.name) || []}
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
                  Business produkty
                </h2>
                <p className="text-gray-600 mt-1">
                  Produkty pro business a práci
                </p>
              </div>
            </div>

            {/* Product Grid */}
            <ProductGrid
              searchQuery={businessSearchQuery}
              limit={20}
              brand={selectedBrand || undefined}
              colors={selectedColors.length > 0 ? selectedColors.join(',') : undefined}
              categories={selectedCollection || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  )
}