"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Slider } from "./ui/slider"
import { ModernCheckbox } from "./ui/modern-checkbox"
import { MultiSelect, Option } from "./ui/multi-select"
import { FilterSkeleton } from "./ui/skeleton"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { ProductFilters, STATIC_CATEGORIES } from "../lib/types"
import { useDebouncedFilters } from "../hooks/useDebounce"
import { X, Filter, Sparkles, Loader2 } from "lucide-react"

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
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  // Use debounced filters for better performance
  const {
    filters: localFilters,
    debouncedFilters,
    isDebouncing,
    updateFilters,
    resetFilters,
    setFilters
  } = useDebouncedFilters(filters, 500)

  // Update parent component when debounced filters change
  useEffect(() => {
    onFiltersChange(debouncedFilters)
  }, [debouncedFilters, onFiltersChange])

  // Update local state when external filters change
  useEffect(() => {
    setFilters(filters)
  }, [filters, setFilters])

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    updateFilters({ [key]: value })
  }

  const handleArrayFilterChange = (key: keyof ProductFilters, value: string, checked: boolean) => {
    const currentArray = (localFilters[key] as string[]) || []
    let newArray: string[]
    
    if (checked) {
      newArray = [...currentArray, value]
    } else {
      newArray = currentArray.filter(item => item !== value)
    }
    
    updateFilters({ [key]: newArray.length > 0 ? newArray : undefined })
  }

  const handleMultiSelectChange = (key: keyof ProductFilters, selected: string[]) => {
    updateFilters({ [key]: selected.length > 0 ? selected : undefined })
  }

  const clearFilter = (key: keyof ProductFilters) => {
    updateFilters({ [key]: undefined })
  }

  const handleClearAll = () => {
    resetFilters()
    onClearFilters()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.category) count += 1
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

  // Prepare options for dropdowns
  const categoryOptions: Option[] = allCategories.map(category => ({
    value: category.slug,
    label: category.name
  }))

  const subcategoryOptions: Option[] = allSubcategories.map(sub => ({
    value: sub.slug,
    label: sub.name
  }))

  const brandOptions: Option[] = brands.map(brand => ({
    value: brand,
    label: brand
  }))

  const featureOptions: Option[] = allFeatures.map(feature => ({
    value: feature.slug,
    label: feature.name
  }))

  const availableColors = [
    'Černá', 'Hnědá', 'Modrá', 'Červená', 'Zelená', 'Béžová', 'Šedá', 'Bílá'
  ]

  const colorOptions: Option[] = availableColors.map(color => ({
    value: color,
    label: color
  }))

  const availableMaterials = [
    'Kůže', 'Umělá kůže', 'Textil', 'Nylon', 'Canvas', 'Syntetické materiály'
  ]

  const materialOptions: Option[] = availableMaterials.map(material => ({
    value: material,
    label: material
  }))

  const FilterContent = () => {
    // Show skeleton while loading
    if (isLoading) {
      return <FilterSkeleton />
    }

    return (
      <div className="space-y-6">
        {/* Loading Indicator */}
        {(isDebouncing || isLoading) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Aktualizace filtrů...</span>
          </div>
        )}

        {/* Active Filters */}
        {getActiveFiltersCount() > 0 && (
          <div className="pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900">Aktivní filtry</h3>
                <Badge variant="secondary" className="text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-gray-500 hover:text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
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
            {filters.category && (
              <Badge key={filters.category} variant="secondary" className="text-xs">
                {allCategories.find(c => c.slug === filters.category)?.name || filters.category}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('category')}
                />
              </Badge>
            )}
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
        <AccordionItem value="gender" className="border-none">
          <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
            <div className="flex items-center gap-2">
              <span>Pohlaví</span>
              {localFilters.gender?.length && (
                <Badge variant="secondary" className="text-xs">
                  {localFilters.gender.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-4">
              {[
                { value: 'men', label: 'Muži', description: 'Produkty pro muže' },
                { value: 'women', label: 'Ženy', description: 'Produkty pro ženy' },
                { value: 'unisex', label: 'Unisex', description: 'Unisex produkty' }
              ].map(option => (
                <ModernCheckbox
                  key={option.value}
                  id={`gender-${option.value}`}
                  checked={localFilters.gender?.includes(option.value as any) || false}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('gender', option.value, checked as boolean)
                  }
                  label={option.label}
                  description={option.description}
                  variant="modern"
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Categories */}
        <AccordionItem value="categories" className="border-none">
          <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
            <div className="flex items-center gap-2">
              <span>Hlavní kategorie</span>
              {localFilters.category && (
                <Badge variant="secondary" className="text-xs">
                  1
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-4">
              <Select
                value={localFilters.category || "all"}
                onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vyberte kategorii..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny kategorie</SelectItem>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Subcategories */}
        {subcategoryOptions.length > 0 && (
          <AccordionItem value="subcategories" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
              <div className="flex items-center gap-2">
                <span>Podkategorie</span>
                {localFilters.subcategory?.length && (
                  <Badge variant="secondary" className="text-xs">
                    {localFilters.subcategory.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <MultiSelect
                  options={subcategoryOptions}
                  selected={localFilters.subcategory || []}
                  onChange={(selected) => handleMultiSelectChange('subcategory', selected)}
                  placeholder="Vyberte podkategorie..."
                  searchPlaceholder="Hledat podkategorie..."
                  maxDisplay={3}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Brands */}
        {brandOptions.length > 0 && (
          <AccordionItem value="brands" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
              <div className="flex items-center gap-2">
                <span>Značky</span>
                {localFilters.brand?.length && (
                  <Badge variant="secondary" className="text-xs">
                    {localFilters.brand.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <MultiSelect
                  options={brandOptions}
                  selected={localFilters.brand || []}
                  onChange={(selected) => handleMultiSelectChange('brand', selected)}
                  placeholder="Vyberte značky..."
                  searchPlaceholder="Hledat značky..."
                  maxDisplay={2}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Price Range */}
        <AccordionItem value="price" className="border-none">
          <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
            <div className="flex items-center gap-2">
              <span>Cenové rozpětí</span>
              {localFilters.priceRange && (
                <Badge variant="secondary" className="text-xs">
                  {localFilters.priceRange.min} - {localFilters.priceRange.max} Kč
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-4">
              <div className="px-2">
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={[
                    localFilters.priceRange?.min || 0,
                    localFilters.priceRange?.max || 10000
                  ]}
                  onValueChange={([min, max]) => 
                    handleFilterChange('priceRange', { min, max })
                  }
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium">{localFilters.priceRange?.min || 0} Kč</span>
                <span className="text-gray-400">–</span>
                <span className="font-medium">{localFilters.priceRange?.max || 10000} Kč</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Features */}
        {featureOptions.length > 0 && (
          <AccordionItem value="features" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Vlastnosti</span>
                {localFilters.features?.length && (
                  <Badge variant="secondary" className="text-xs">
                    {localFilters.features.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <MultiSelect
                  options={featureOptions}
                  selected={localFilters.features || []}
                  onChange={(selected) => handleMultiSelectChange('features', selected)}
                  placeholder="Vyberte vlastnosti..."
                  searchPlaceholder="Hledat vlastnosti..."
                  maxDisplay={2}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Colors */}
        <AccordionItem value="colors" className="border-none">
          <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>
              <span>Barvy</span>
              {localFilters.colors?.length && (
                <Badge variant="secondary" className="text-xs">
                  {localFilters.colors.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-4">
              <MultiSelect
                options={colorOptions}
                selected={localFilters.colors || []}
                onChange={(selected) => handleMultiSelectChange('colors', selected)}
                placeholder="Vyberte barvy..."
                searchPlaceholder="Hledat barvy..."
                maxDisplay={3}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Materials */}
        <AccordionItem value="materials" className="border-none">
          <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
            <div className="flex items-center gap-2">
              <span>Materiály</span>
              {localFilters.materials?.length && (
                <Badge variant="secondary" className="text-xs">
                  {localFilters.materials.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-4">
              <MultiSelect
                options={materialOptions}
                selected={localFilters.materials || []}
                onChange={(selected) => handleMultiSelectChange('materials', selected)}
                placeholder="Vyberte materiály..."
                searchPlaceholder="Hledat materiály..."
                maxDisplay={2}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability */}
        <AccordionItem value="availability" className="border-none">
          <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
            <div className="flex items-center gap-2">
              <span>Dostupnost</span>
              {localFilters.availability?.length && (
                <Badge variant="secondary" className="text-xs">
                  {localFilters.availability.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-4">
              {[
                { value: 'in_stock', label: 'Skladem', description: 'Okamžitě k odeslání' },
                { value: 'low_stock', label: 'Málo skladem', description: 'Poslední kusy' },
                { value: 'pre_order', label: 'Předobjednávka', description: 'Doručení na objednávku' }
              ].map(option => (
                <ModernCheckbox
                  key={option.value}
                  id={`availability-${option.value}`}
                  checked={localFilters.availability?.includes(option.value as any) || false}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('availability', option.value, checked as boolean)
                  }
                  label={option.label}
                  description={option.description}
                  variant="modern"
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )}

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(true)}
          className="w-full relative overflow-hidden group hover:shadow-md transition-all duration-200"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <Filter className="mr-2 h-4 w-4 relative z-10" />
          <span className="relative z-10">
            Filtry {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </span>
          {(isDebouncing || isLoading) && <Loader2 className="ml-2 h-4 w-4 animate-spin relative z-10" />}
        </Button>
      </div>

      {/* Desktop Filters */}
      <div className={`hidden lg:block ${className}`}>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg p-6 sticky top-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Filtry produktů</h2>
              <p className="text-xs text-gray-500">Najděte přesně to, co hledáte</p>
            </div>
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300" 
            onClick={() => setShowMobileFilters(false)} 
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200 animate-in slide-in-from-right-10 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Filter className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Filtry</h2>
                  <p className="text-xs text-gray-500">Najděte to, co hledáte</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(false)}
                className="rounded-full w-8 h-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto h-full pb-24">
              <FilterContent />
            </div>
            
            {/* Mobile Apply Button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200/60">
              <Button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Použít filtry {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}