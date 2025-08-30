"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Slider } from "./ui/slider"
import { Checkbox } from "./ui/checkbox"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { ProductFilters, STATIC_CATEGORIES } from "../lib/types"
import { X, Filter } from "lucide-react"

interface ProductFiltersProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  onClearFilters: () => void
  brands?: string[]
  isLoading?: boolean
  className?: string
}

export default function ProductFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  brands = [],
  isLoading = false,
  className = ""
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleArrayFilterChange = (key: keyof ProductFilters, value: string, checked: boolean) => {
    const currentArray = (localFilters[key] as string[]) || []
    let newArray: string[]
    
    if (checked) {
      newArray = [...currentArray, value]
    } else {
      newArray = currentArray.filter(item => item !== value)
    }
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined)
  }

  const clearFilter = (key: keyof ProductFilters) => {
    handleFilterChange(key, undefined)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.category?.length) count += filters.category.length
    if (filters.subcategory?.length) count += filters.subcategory.length
    if (filters.brand?.length) count += filters.brand.length
    if (filters.gender?.length) count += filters.gender.length
    if (filters.features?.length) count += filters.features.length
    if (filters.colors?.length) count += filters.colors.length
    if (filters.materials?.length) count += filters.materials.length
    if (filters.availability?.length) count += filters.availability.length
    if (filters.priceRange) count += 1
    return count
  }

  const allCategories = [
    ...STATIC_CATEGORIES.men,
    ...STATIC_CATEGORIES.women,
    ...STATIC_CATEGORIES.unisex
  ]

  const allSubcategories = allCategories.flatMap(cat => cat.children || [])
  const allFeatures = allCategories.flatMap(cat => cat.features || [])

  const availableColors = [
    'Černá', 'Hnědá', 'Modrá', 'Červená', 'Zelená', 'Béžová', 'Šedá', 'Bílá'
  ]

  const availableMaterials = [
    'Kůže', 'Umělá kůže', 'Textil', 'Nylon', 'Canvas', 'Syntetické materiály'
  ]

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Aktivní filtry</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Vymazat vše
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.gender?.map(gender => (
              <Badge key={gender} variant="secondary" className="text-xs">
                {gender === 'men' ? 'Muži' : gender === 'women' ? 'Ženy' : 'Unisex'}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => handleArrayFilterChange('gender', gender, false)}
                />
              </Badge>
            ))}
            {filters.category?.map(category => (
              <Badge key={category} variant="secondary" className="text-xs">
                {allCategories.find(c => c.slug === category)?.name || category}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => handleArrayFilterChange('category', category, false)}
                />
              </Badge>
            ))}
            {filters.brand?.map(brand => (
              <Badge key={brand} variant="secondary" className="text-xs">
                {brand}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => handleArrayFilterChange('brand', brand, false)}
                />
              </Badge>
            ))}
            {filters.priceRange && (
              <Badge variant="secondary" className="text-xs">
                {filters.priceRange.min} - {filters.priceRange.max} Kč
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('priceRange')}
                />
              </Badge>
            )}
          </div>
        </div>
      )}

      <Accordion type="multiple" defaultValue={["gender", "categories", "price"]} className="w-full">
        {/* Gender Filter */}
        <AccordionItem value="gender">
          <AccordionTrigger className="text-sm font-medium">
            Pohlaví
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {[
                { value: 'men', label: 'Muži' },
                { value: 'women', label: 'Ženy' },
                { value: 'unisex', label: 'Unisex' }
              ].map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`gender-${option.value}`}
                    checked={filters.gender?.includes(option.value as any) || false}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('gender', option.value, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={`gender-${option.value}`} 
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-medium">
            Kategorie
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {allCategories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.slug}`}
                    checked={filters.category?.includes(category.slug) || false}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('category', category.slug, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={`category-${category.slug}`} 
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Brands */}
        {brands.length > 0 && (
          <AccordionItem value="brands">
            <AccordionTrigger className="text-sm font-medium">
              Značky
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {brands.map(brand => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={filters.brand?.includes(brand) || false}
                      onCheckedChange={(checked) => 
                        handleArrayFilterChange('brand', brand, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={`brand-${brand}`} 
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {brand}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">
            Cena
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={[
                    filters.priceRange?.min || 0,
                    filters.priceRange?.max || 10000
                  ]}
                  onValueChange={([min, max]) => 
                    handleFilterChange('priceRange', { min, max })
                  }
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{filters.priceRange?.min || 0} Kč</span>
                <span>{filters.priceRange?.max || 10000} Kč</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Features */}
        {allFeatures.length > 0 && (
          <AccordionItem value="features">
            <AccordionTrigger className="text-sm font-medium">
              Vlastnosti
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {allFeatures.map(feature => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature.slug}`}
                      checked={filters.features?.includes(feature.slug) || false}
                      onCheckedChange={(checked) => 
                        handleArrayFilterChange('features', feature.slug, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={`feature-${feature.slug}`} 
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {feature.name}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Colors */}
        <AccordionItem value="colors">
          <AccordionTrigger className="text-sm font-medium">
            Barvy
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {availableColors.map(color => (
                <div key={color} className="flex items-center space-x-2">
                  <Checkbox
                    id={`color-${color}`}
                    checked={filters.colors?.includes(color) || false}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('colors', color, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={`color-${color}`} 
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {color}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Materials */}
        <AccordionItem value="materials">
          <AccordionTrigger className="text-sm font-medium">
            Materiály
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {availableMaterials.map(material => (
                <div key={material} className="flex items-center space-x-2">
                  <Checkbox
                    id={`material-${material}`}
                    checked={filters.materials?.includes(material) || false}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('materials', material, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={`material-${material}`} 
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {material}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability */}
        <AccordionItem value="availability">
          <AccordionTrigger className="text-sm font-medium">
            Dostupnost
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {[
                { value: 'in_stock', label: 'Skladem' },
                { value: 'low_stock', label: 'Málo skladem' },
                { value: 'pre_order', label: 'Předobjednávka' }
              ].map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`availability-${option.value}`}
                    checked={filters.availability?.includes(option.value as any) || false}
                    onCheckedChange={(checked) => 
                      handleArrayFilterChange('availability', option.value, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={`availability-${option.value}`} 
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(true)}
          className="w-full"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtry {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
        </Button>
      </div>

      {/* Desktop Filters */}
      <div className={`hidden lg:block ${className}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Filtry</h2>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Filtry</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto h-full pb-20">
              <FilterContent />
            </div>
          </div>
        </div>
      )}
    </>
  )
}