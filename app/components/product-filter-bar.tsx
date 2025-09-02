"use client"

import { useState } from 'react'
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { X, Filter, ChevronDown } from "lucide-react"
import { getAvailableCategories } from "../lib/product-categories"

interface FilterBarProps {
  selectedFilters: {
    categories: string[]
    brands: string[]
    priceRanges: string[]
    features: string[]
    productTypes: string[]
  }
  onToggleFilter: (type: string, value: string) => void
  onClearAll: () => void
  collections?: any[]
  brands?: any[]
  loading?: boolean
}

export default function ProductFilterBar({ 
  selectedFilters, 
  onToggleFilter, 
  onClearAll,
  collections = [],
  brands = [],
  loading = false
}: FilterBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const productCategories = getAvailableCategories()
  
  const priceRanges = [
    { label: "Do 3 000 Kč", min: 0, max: 3000 },
    { label: "3 000 - 7 000 Kč", min: 3000, max: 7000 },
    { label: "7 000 - 12 000 Kč", min: 7000, max: 12000 },
    { label: "Nad 12 000 Kč", min: 12000, max: Number.POSITIVE_INFINITY },
  ]

  const activeFiltersCount =
    selectedFilters.categories.length + 
    selectedFilters.brands.length + 
    selectedFilters.priceRanges.length + 
    selectedFilters.features.length + 
    selectedFilters.productTypes.length

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4">
        
        {/* Desktop Filter Chips */}
        <div className="hidden lg:flex items-center gap-3 flex-wrap">
          
          {/* Product Types */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Typ:</span>
            {productCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedFilters.productTypes.includes(category.id) ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleFilter("productTypes", category.id)}
                className={`text-xs ${
                  selectedFilters.productTypes.includes(category.id) 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "border-gray-300 hover:border-blue-600"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Price Ranges */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Cena:</span>
            {priceRanges.map((range) => (
              <Button
                key={range.label}
                variant={selectedFilters.priceRanges.includes(range.label) ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleFilter("priceRanges", range.label)}
                className={`text-xs ${
                  selectedFilters.priceRanges.includes(range.label) 
                    ? "bg-black hover:bg-gray-800" 
                    : "border-gray-300 hover:border-black"
                }`}
              >
                {range.label}
              </Button>
            ))}
          </div>

          {/* Collections */}
          {collections.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Kolekce:</span>
              {collections.slice(0, 4).map((collection) => (
                <Button
                  key={collection.id}
                  variant={selectedFilters.categories.includes(collection.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToggleFilter("categories", collection.id)}
                  className={`text-xs ${
                    selectedFilters.categories.includes(collection.id) 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "border-gray-300 hover:border-green-600"
                  }`}
                >
                  {collection.name}
                </Button>
              ))}
            </div>
          )}

          {/* Clear All */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Vymazat vše ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtry
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Vymazat
            </Button>
          )}
        </div>

        {/* Mobile Filter Dropdown */}
        {showMobileFilters && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4 space-y-4">
            
            {/* Product Types Mobile */}
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-2">Typ produktu</h4>
              <div className="flex flex-wrap gap-2">
                {productCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedFilters.productTypes.includes(category.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggleFilter("productTypes", category.id)}
                    className={`text-xs ${
                      selectedFilters.productTypes.includes(category.id) 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "border-gray-300"
                    }`}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Mobile */}
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-2">Cena</h4>
              <div className="flex flex-wrap gap-2">
                {priceRanges.map((range) => (
                  <Button
                    key={range.label}
                    variant={selectedFilters.priceRanges.includes(range.label) ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggleFilter("priceRanges", range.label)}
                    className={`text-xs ${
                      selectedFilters.priceRanges.includes(range.label) 
                        ? "bg-black hover:bg-gray-800" 
                        : "border-gray-300"
                    }`}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Active Filter Tags */}
        {activeFiltersCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            
            {/* Product Type Tags */}
            {selectedFilters.productTypes.map((typeId) => {
              const category = productCategories.find(cat => cat.id === typeId)
              return (
                <Badge
                  key={typeId}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  {category?.name}
                  <button
                    onClick={() => onToggleFilter("productTypes", typeId)}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}

            {/* Collection Tags */}
            {selectedFilters.categories.map((collectionId) => {
              const collection = collections.find(col => col.id === collectionId)
              return (
                <Badge
                  key={collectionId}
                  variant="secondary" 
                  className="bg-green-100 text-green-800 hover:bg-green-200"
                >
                  {collection?.name || collectionId}
                  <button
                    onClick={() => onToggleFilter("categories", collectionId)}
                    className="ml-1 hover:text-green-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}

            {/* Price Tags */}
            {selectedFilters.priceRanges.map((range) => (
              <Badge
                key={range}
                variant="secondary"
                className="bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                {range}
                <button
                  onClick={() => onToggleFilter("priceRanges", range)}
                  className="ml-1 hover:text-gray-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

          </div>
        )}
      </div>
    </div>
  )
}