"use client"

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '../app/components/ui/card'
import { Button } from '../app/components/ui/button'
import { Badge } from '../app/components/ui/badge'

interface FilterSection {
  title: string
  isOpen: boolean
}

interface FilterOption {
  id: string
  name: string
  count: number
  selected?: boolean
}

interface FilterData {
  categories: FilterOption[]
  brands: FilterOption[]
  materials: FilterOption[]
  sizes: FilterOption[]
  priceRange: { min: number; max: number }
  availability: { inStock: number; total: number }
}

interface ProductFiltersProps {
  onFiltersChange?: (filters: any) => void
  initialCategory?: string | null
}

export default function ProductFiltersSidebar({ onFiltersChange, initialCategory }: ProductFiltersProps) {
  const [sections, setSections] = useState<Record<string, boolean>>({
    category: true,
    gender: true,
    availability: true,
    price: true,
    productType: true,
    material: true,
    size: true,
    color: true,
    brand: true,
  })

  const [filters, setFilters] = useState({
    category: '',
    gender: '',
    inStock: false,
    priceMin: 0,
    priceMax: 10000,
    categories: [] as string[],
    materials: [] as string[],
    sizes: [] as string[],
    colors: [] as string[],
    brands: [] as string[],
  })

  const [filterData, setFilterData] = useState<FilterData>({
    categories: [],
    brands: [],
    materials: [],
    sizes: [],
    priceRange: { min: 0, max: 10000 },
    availability: { inStock: 0, total: 0 }
  })

  const [loading, setLoading] = useState(true)

  // Set initial category if provided
  useEffect(() => {
    if (initialCategory) {
      setFilters(prev => ({
        ...prev,
        categories: [initialCategory]
      }))
    }
  }, [initialCategory])

  // Load filter options from API
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await fetch('/api/filters')
        if (response.ok) {
          const data = await response.json()
          setFilterData(data)
          setFilters(prev => ({
            ...prev,
            priceMax: data.priceRange.max
          }))
        }
      } catch (error) {
        console.error('Error loading filters:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFilters()
  }, [])

  const colorOptions = [
    { name: 'Černá', hex: '#000000' },
    { name: 'Hnědá', hex: '#8B4513' },
    { name: 'Zelená', hex: '#008000' },
    { name: 'Šedá', hex: '#808080' },
    { name: 'Modrá', hex: '#0000FF' },
    { name: 'Oranžová', hex: '#FFA500' },
    { name: 'Růžová', hex: '#FFC0CB' },
    { name: 'Fialová', hex: '#800080' },
    { name: 'Červená', hex: '#FF0000' },
    { name: 'Žlutá', hex: '#FFFF00' },
  ]

  const toggleSection = (sectionKey: string) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  const toggleFilter = (filterType: string, value: string) => {
    setFilters(prev => {
      const currentArray = prev[filterType as keyof typeof prev] as string[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
      
      return {
        ...prev,
        [filterType]: newArray
      }
    })
  }

  const handlePriceChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      priceMin: min,
      priceMax: max
    }))
  }

  useEffect(() => {
    onFiltersChange?.(filters)
  }, [filters, onFiltersChange])

  const FilterSectionHeader = ({ title, sectionKey }: { title: string, sectionKey: string }) => (
    <div 
      className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-200"
      onClick={() => toggleSection(sectionKey)}
    >
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{title}</h3>
      {sections[sectionKey] ? 
        <ChevronUp className="h-4 w-4 text-gray-500" /> : 
        <ChevronDown className="h-4 w-4 text-gray-500" />
      }
    </div>
  )

  return (
    <div className="w-64 bg-gray-50 p-4 space-y-1">
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          background: #3B82F6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          background: #3B82F6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .slider::-webkit-slider-track {
          background: transparent;
        }
        .slider::-moz-range-track {
          background: transparent;
        }
      `}</style>
      {/* Gender Filter */}
      <div>
        <FilterSectionHeader title="POHLAVÍ" sectionKey="gender" />
        {sections.gender && (
          <div className="py-3">
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={filters.gender}
              onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
            >
              <option value="">Všechny produkty</option>
              <option value="panske">Pánské</option>
              <option value="damske">Dámské</option>
            </select>
          </div>
        )}
      </div>

      {/* Product Type Categories */}
      <div>
        <FilterSectionHeader title="KATEGORIE PRODUKTŮ" sectionKey="productType" />
        {sections.productType && (
          <div className="py-3 space-y-2">
            {[
              { id: 'tasky', name: 'Tašky', icon: '🎒' },
              { id: 'brasny', name: 'Brašny', icon: '💼' },
              { id: 'pezenky', name: 'Peněženky', icon: '👛' },
              { id: 'batohy', name: 'Batohy', icon: '🎒' },
              { id: 'doplnky', name: 'Doplňky', icon: '👜' },
            ].map((category) => (
              <label key={category.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.id)}
                  onChange={() => toggleFilter('categories', category.id)}
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="mr-2">{category.icon}</span>
                <span className="text-sm text-gray-700 font-medium">{category.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div>
        <FilterSectionHeader title="DOSTUPNOST" sectionKey="availability" />
        {sections.availability && (
          <div className="py-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                className="mr-2 rounded"
              />
              <span className="text-sm text-gray-700">Pouze skladem</span>
            </label>
          </div>
        )}
      </div>

      {/* Price Range */}
      <div>
        <FilterSectionHeader title="CENOVÉ ROZPĚTÍ" sectionKey="price" />
        {sections.price && (
          <div className="py-4 space-y-4">
            {loading ? (
              <div className="text-sm text-gray-500">Načítání...</div>
            ) : (
              <>
                <div className="space-y-3">
                  {/* Min Price Slider */}
                  <div>
                    <label className="text-xs text-gray-600 font-medium mb-1 block">Od</label>
                    <input
                      type="range"
                      min={filterData.priceRange.min}
                      max={filters.priceMax}
                      value={filters.priceMin}
                      onChange={(e) => handlePriceChange(parseInt(e.target.value), filters.priceMax)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(filters.priceMin / filterData.priceRange.max) * 100}%, #E5E7EB ${(filters.priceMin / filterData.priceRange.max) * 100}%, #E5E7EB 100%)`
                      }}
                    />
                  </div>
                  
                  {/* Max Price Slider */}
                  <div>
                    <label className="text-xs text-gray-600 font-medium mb-1 block">Do</label>
                    <input
                      type="range"
                      min={filters.priceMin}
                      max={filterData.priceRange.max}
                      value={filters.priceMax}
                      onChange={(e) => handlePriceChange(filters.priceMin, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #E5E7EB 0%, #E5E7EB ${(filters.priceMax / filterData.priceRange.max) * 100}%, #3B82F6 ${(filters.priceMax / filterData.priceRange.max) * 100}%, #3B82F6 100%)`
                      }}
                    />
                  </div>
                </div>
                
                {/* Price Display */}
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Od</div>
                      <div className="font-bold text-gray-900">{filters.priceMin.toLocaleString()} Kč</div>
                    </div>
                    <div className="w-8 h-px bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Do</div>
                      <div className="font-bold text-gray-900">{filters.priceMax.toLocaleString()} Kč</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>


      {/* Material */}
      <div>
        <FilterSectionHeader title="MATERIÁL" sectionKey="material" />
        {sections.material && (
          <div className="py-3 space-y-2">
            {loading ? (
              <div className="text-sm text-gray-500">Načítání...</div>
            ) : filterData.materials.map((option) => (
              <label key={option.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.materials.includes(option.id)}
                  onChange={() => toggleFilter('materials', option.id)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">{option.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Size */}
      <div>
        <FilterSectionHeader title="VELIKOST" sectionKey="size" />
        {sections.size && (
          <div className="py-3 space-y-2">
            {loading ? (
              <div className="text-sm text-gray-500">Načítání...</div>
            ) : filterData.sizes.map((option) => (
              <label key={option.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.sizes.includes(option.id)}
                  onChange={() => toggleFilter('sizes', option.id)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">{option.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Colors */}
      <div>
        <FilterSectionHeader title="BARVA" sectionKey="color" />
        {sections.color && (
          <div className="py-3">
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  onClick={() => toggleFilter('colors', color.name)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    filters.colors.includes(color.name) 
                      ? 'border-gray-900 ring-2 ring-gray-300' 
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Brand */}
      <div>
        <FilterSectionHeader title="ZNAČKA" sectionKey="brand" />
        {sections.brand && (
          <div className="py-3 space-y-2">
            {loading ? (
              <div className="text-sm text-gray-500">Načítání...</div>
            ) : filterData.brands.map((option) => (
              <label key={option.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(option.id)}
                  onChange={() => toggleFilter('brands', option.id)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">{option.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}