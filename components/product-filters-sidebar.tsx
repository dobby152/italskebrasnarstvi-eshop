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
    availability: true,
    price: true,
    categories: true,
    material: true,
    size: true,
    color: true,
    brand: true,
  })

  const [filters, setFilters] = useState({
    category: '',
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
      {/* Category Dropdown */}
      <div>
        <FilterSectionHeader title="KATEGORIE" sectionKey="category" />
        {sections.category && (
          <div className="py-3">
            <select 
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Všechny kategorie</option>
              <option value="panske">Pánské</option>
              <option value="damske">Dámské</option>
            </select>
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
        <FilterSectionHeader title="CENA" sectionKey="price" />
        {sections.price && (
          <div className="py-3 space-y-3">
            {loading ? (
              <div className="text-sm text-gray-500">Načítání...</div>
            ) : (
              <>
                <input
                  type="range"
                  min={filterData.priceRange.min}
                  max={filterData.priceRange.max}
                  value={filters.priceMax}
                  onChange={(e) => handlePriceChange(filters.priceMin, parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Kč {filters.priceMin.toLocaleString()}</span>
                  <span>až</span>
                  <span>Kč {filters.priceMax.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Categories */}
      <div>
        <FilterSectionHeader title="KATEGORIE" sectionKey="categories" />
        {sections.categories && (
          <div className="py-3 space-y-2">
            {loading ? (
              <div className="text-sm text-gray-500">Načítání...</div>
            ) : filterData.categories.map((option) => (
              <label key={option.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(option.id)}
                  onChange={() => toggleFilter('categories', option.id)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">{option.name}</span>
              </label>
            ))}
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