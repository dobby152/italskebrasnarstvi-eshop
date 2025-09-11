"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "../app/components/ui/button"
import { Badge } from "../app/components/ui/badge"
import { ModernCheckbox } from "./ui/modern-checkbox"
import { MultiSelect, Option } from "./ui/multi-select"
import { FilterSkeleton } from "./ui/skeleton"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../app/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../app/components/ui/select"
import { useDebouncedFilters } from "../hooks/useDebounce"
import { X, Filter, Sparkles, Loader2 } from "lucide-react"

interface ProductFiltersProps {
  onFiltersChange?: (filters: any) => void
  initialCategory?: string | null
  isLoading?: boolean
}

interface FilterState {
  categories: string[]
  brands: string[]
  gender: string
  inStock: boolean
  priceMin: number
  priceMax: number
  materials: string[]
  colors: string[]
  sizes: string[]
}

const initialFilterState: FilterState = {
  categories: [],
  brands: [],
  gender: '',
  inStock: false,
  priceMin: 0,
  priceMax: 50000,
  materials: [],
  colors: [],
  sizes: []
}

export default function ProductFiltersSidebar({ 
  onFiltersChange, 
  initialCategory, 
  isLoading = false 
}: ProductFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  // Initialize filters with category if provided
  const initFilters = initialCategory 
    ? { ...initialFilterState, categories: [initialCategory] }
    : initialFilterState

  // Use debounced filters for better performance
  const {
    filters: localFilters,
    debouncedFilters,
    isDebouncing,
    updateFilters,
    resetFilters,
    setFilters
  } = useDebouncedFilters(initFilters, 500)

  // Notify parent when debounced filters change
  useEffect(() => {
    onFiltersChange?.(debouncedFilters)
  }, [debouncedFilters, onFiltersChange])

  // Handle category initialization
  useEffect(() => {
    if (initialCategory && !localFilters.categories.includes(initialCategory)) {
      updateFilters({ categories: [initialCategory] })
    }
  }, [initialCategory, localFilters.categories, updateFilters])

  const handleArrayFilterChange = (key: keyof FilterState, value: string, checked: boolean) => {
    const currentArray = (localFilters[key] as string[]) || []
    let newArray: string[]
    
    if (checked) {
      newArray = [...currentArray, value]
    } else {
      newArray = currentArray.filter(item => item !== value)
    }
    
    updateFilters({ [key]: newArray })
  }

  const handleMultiSelectChange = (key: keyof FilterState, selected: string[]) => {
    updateFilters({ [key]: selected })
  }

  const handleClearAll = () => {
    resetFilters()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (localFilters.categories.length > 0) count += localFilters.categories.length
    if (localFilters.brands.length > 0) count += localFilters.brands.length
    if (localFilters.gender) count += 1
    if (localFilters.inStock) count += 1
    if (localFilters.priceMin > 0 || localFilters.priceMax < 50000) count += 1
    if (localFilters.materials.length > 0) count += localFilters.materials.length
    if (localFilters.colors.length > 0) count += localFilters.colors.length
    if (localFilters.sizes.length > 0) count += localFilters.sizes.length
    return count
  }

  // Define filter options
  const categoryOptions: Option[] = [
    { value: 'panske-batohy', label: 'Pánské batohy' },
    { value: 'damske-batohy', label: 'Dámské batohy' },
    { value: 'panske-tasky', label: 'Pánské tašky' },
    { value: 'damske-tasky', label: 'Dámské tašky' },
    { value: 'penske-penezenky', label: 'Pánské peněženky' },
    { value: 'damske-penezenky', label: 'Dámské peněženky' },
    { value: 'cestovni-batohy', label: 'Cestovní batohy' },
    { value: 'business-tasky', label: 'Business tašky' },
    { value: 'notebook-tasky', label: 'Tašky na notebook' },
    { value: 'crossbody-tasky', label: 'Crossbody tašky' },
  ]

  const brandOptions: Option[] = [
    { value: 'Piquadro', label: 'Piquadro' },
    { value: 'Samsonite', label: 'Samsonite' },
    { value: 'Delsey', label: 'Delsey' },
  ]

  const materialOptions: Option[] = [
    { value: 'Kůže', label: 'Pravá kůže' },
    { value: 'Umělá kůže', label: 'Umělá kůže' },
    { value: 'Nylon', label: 'Nylon' },
    { value: 'Canvas', label: 'Canvas' },
    { value: 'Textil', label: 'Textil' },
  ]

  const colorOptions: Option[] = [
    { value: 'Černá', label: 'Černá' },
    { value: 'Hnědá', label: 'Hnědá' },
    { value: 'Modrá', label: 'Modrá' },
    { value: 'Červená', label: 'Červená' },
    { value: 'Zelená', label: 'Zelená' },
    { value: 'Béžová', label: 'Béžová' },
    { value: 'Šedá', label: 'Šedá' },
    { value: 'Bílá', label: 'Bílá' },
  ]

  const sizeOptions: Option[] = [
    { value: 'S', label: 'Malé (S)' },
    { value: 'M', label: 'Střední (M)' },
    { value: 'L', label: 'Velké (L)' },
    { value: 'XL', label: 'Extra velké (XL)' },
  ]

  const FilterContent = () => {
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
              {localFilters.categories.map(category => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {categoryOptions.find(c => c.value === category)?.label || category}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => handleArrayFilterChange('categories', category, false)}
                  />
                </Badge>
              ))}
              {localFilters.brands.map(brand => (
                <Badge key={brand} variant="secondary" className="text-xs">
                  {brand}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => handleArrayFilterChange('brands', brand, false)}
                  />
                </Badge>
              ))}
              {localFilters.gender && (
                <Badge variant="secondary" className="text-xs">
                  {localFilters.gender === 'men' ? 'Muži' : 'Ženy'}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters({ gender: '' })}
                  />
                </Badge>
              )}
              {localFilters.inStock && (
                <Badge variant="secondary" className="text-xs">
                  Skladem
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters({ inStock: false })}
                  />
                </Badge>
              )}
              {(localFilters.priceMin > 0 || localFilters.priceMax < 50000) && (
                <Badge variant="secondary" className="text-xs">
                  {localFilters.priceMin} - {localFilters.priceMax} Kč
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters({ priceMin: 0, priceMax: 50000 })}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}

        <Accordion type="multiple" defaultValue={["categories", "gender", "availability"]} className="w-full">
          {/* Categories */}
          <AccordionItem value="categories" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
              <div className="flex items-center gap-2">
                <span>Kategorie</span>
                {localFilters.categories.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {localFilters.categories.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <MultiSelect
                  options={categoryOptions}
                  selected={localFilters.categories}
                  onChange={(selected) => handleMultiSelectChange('categories', selected)}
                  placeholder="Vyberte kategorie..."
                  searchPlaceholder="Hledat kategorie..."
                  maxDisplay={2}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Gender */}
          <AccordionItem value="gender" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
              <div className="flex items-center gap-2">
                <span>Pohlaví</span>
                {localFilters.gender && (
                  <Badge variant="secondary" className="text-xs">
                    1
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <Select
                  value={localFilters.gender}
                  onValueChange={(value) => updateFilters({ gender: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Vyberte pohlaví..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Všechna pohlaví</SelectItem>
                    <SelectItem value="men">Muži</SelectItem>
                    <SelectItem value="women">Ženy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Brands */}
          <AccordionItem value="brands" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
              <div className="flex items-center gap-2">
                <span>Značky</span>
                {localFilters.brands.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {localFilters.brands.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <MultiSelect
                  options={brandOptions}
                  selected={localFilters.brands}
                  onChange={(selected) => handleMultiSelectChange('brands', selected)}
                  placeholder="Vyberte značky..."
                  searchPlaceholder="Hledat značky..."
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
                {localFilters.inStock && (
                  <Badge variant="secondary" className="text-xs">
                    1
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <ModernCheckbox
                  checked={localFilters.inStock}
                  onCheckedChange={(checked) => updateFilters({ inStock: checked as boolean })}
                  label="Pouze skladem"
                  description="Zobrazit pouze produkty dostupné na skladě"
                  variant="modern"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price Range */}
          <AccordionItem value="price" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
              <div className="flex items-center gap-2">
                <span>Cenové rozpětí</span>
                {(localFilters.priceMin > 0 || localFilters.priceMax < 50000) && (
                  <Badge variant="secondary" className="text-xs">
                    {localFilters.priceMin} - {localFilters.priceMax} Kč
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Od (Kč)</label>
                    <input
                      type="number"
                      value={localFilters.priceMin}
                      onChange={(e) => updateFilters({ priceMin: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      min="0"
                      max="50000"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Do (Kč)</label>
                    <input
                      type="number"
                      value={localFilters.priceMax}
                      onChange={(e) => updateFilters({ priceMax: parseInt(e.target.value) || 50000 })}
                      className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      min="0"
                      max="50000"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Materials */}
          <AccordionItem value="materials" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
              <div className="flex items-center gap-2">
                <span>Materiály</span>
                {localFilters.materials.length > 0 && (
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
                  selected={localFilters.materials}
                  onChange={(selected) => handleMultiSelectChange('materials', selected)}
                  placeholder="Vyberte materiály..."
                  searchPlaceholder="Hledat materiály..."
                  maxDisplay={2}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Colors */}
          <AccordionItem value="colors" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>
                <span>Barvy</span>
                {localFilters.colors.length > 0 && (
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
                  selected={localFilters.colors}
                  onChange={(selected) => handleMultiSelectChange('colors', selected)}
                  placeholder="Vyberte barvy..."
                  searchPlaceholder="Hledat barvy..."
                  maxDisplay={3}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Sizes */}
          <AccordionItem value="sizes" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:text-blue-600 transition-colors [&[data-state=open]]:text-blue-600">
              <div className="flex items-center gap-2">
                <span>Velikosti</span>
                {localFilters.sizes.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {localFilters.sizes.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4">
                <MultiSelect
                  options={sizeOptions}
                  selected={localFilters.sizes}
                  onChange={(selected) => handleMultiSelectChange('sizes', selected)}
                  placeholder="Vyberte velikosti..."
                  maxDisplay={4}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  }

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
      <div className="hidden lg:block">
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