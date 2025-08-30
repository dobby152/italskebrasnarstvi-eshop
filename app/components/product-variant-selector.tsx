"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { ProductVariant } from "../lib/types/variants"
import { formatPrice } from "../lib/utils"

interface ProductVariantSelectorProps {
  variants: ProductVariant[]
  selectedVariantId?: string
  onVariantChange: (variant: ProductVariant) => void
  basePrice: number
}

export default function ProductVariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
  basePrice
}: ProductVariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.find(v => v.id.toString() === selectedVariantId) || null
  )

  // Sync internal selection when parent-provided selectedVariantId changes
  useEffect(() => {
    if (selectedVariantId) {
      const next = variants.find(v => v.id.toString() === selectedVariantId) || null
      setSelectedVariant(next)
    } else if (!selectedVariant && variants.length > 0) {
      // Fallback: ensure we have some selection to improve UX
      setSelectedVariant(variants[0])
    }
  }, [selectedVariantId, variants])

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    onVariantChange(variant)
  }

  if (!variants || variants.length === 0) {
    return null
  }

  // Group variants by attribute type
  const getColorVariants = () => {
    const colors: { [key: string]: ProductVariant } = {}
    variants.forEach(variant => {
      if (variant.attributes && variant.attributes.color) {
        const colorValue = variant.attributes.color.value
        if (!colors[colorValue]) {
          colors[colorValue] = variant
        }
      }
    })
    return Object.values(colors)
  }

  const getSizeVariants = () => {
    const sizes: { [key: string]: ProductVariant } = {}
    variants.forEach(variant => {
      if (variant.attributes && variant.attributes.size) {
        const sizeValue = variant.attributes.size.value
        if (!sizes[sizeValue]) {
          sizes[sizeValue] = variant
        }
      }
    })
    return Object.values(sizes)
  }

  const getMaterialVariants = () => {
    const materials: { [key: string]: ProductVariant } = {}
    variants.forEach(variant => {
      if (variant.attributes && variant.attributes.material) {
        const materialValue = variant.attributes.material.value
        if (!materials[materialValue]) {
          materials[materialValue] = variant
        }
      }
    })
    return Object.values(materials)
  }

  const colorVariants = getColorVariants()
  const sizeVariants = getSizeVariants()
  const materialVariants = getMaterialVariants()

  const getFinalPrice = (variant: ProductVariant) => {
    return variant.price
  }

  const getStockStatus = (variant: ProductVariant) => {
    if (variant.status === 'inactive') return { status: 'inactive', label: 'Nedostupné' }
    if (variant.inventory_quantity === 0) return { status: 'out-of-stock', label: 'Vyprodáno' }
    if (variant.inventory_quantity <= 3) return { status: 'low-stock', label: 'Málo skladem' }
    return { status: 'in-stock', label: 'Skladem' }
  }

  return (
    <div className="space-y-6">
      {/* Color variants */}
      {colorVariants.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Barva</h4>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((variant) => {
              if (!variant.attributes || !variant.attributes.color) return null
              
              const colorAttr = variant.attributes.color
              const stockStatus = getStockStatus(variant)
              const isSelected = selectedVariant?.id === variant.id
              const isAvailable = variant.status === 'active' && variant.inventory_quantity > 0
              
              return (
                <Button
                  key={variant.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!isAvailable}
                  onClick={() => handleVariantSelect(variant)}
                  className={`
                    relative
                    ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="flex items-center gap-2">
                    {colorAttr.hexColor && (
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: colorAttr.hexColor }}
                      />
                    )}
                    {colorAttr.displayValue}
                  </span>
                  {variant.compare_at_price && variant.compare_at_price > variant.price && (
                    <span className="ml-2 text-xs">
                      {formatPrice(variant.compare_at_price - variant.price)}
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Size variants */}
      {sizeVariants.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Velikost</h4>
          <div className="flex flex-wrap gap-2">
            {sizeVariants.map((variant) => {
              if (!variant.attributes || !variant.attributes.size) return null
              
              const sizeAttr = variant.attributes.size
              const stockStatus = getStockStatus(variant)
              const isSelected = selectedVariant?.id === variant.id
              const isAvailable = variant.status === 'active' && variant.inventory_quantity > 0
              
              return (
                <Button
                  key={variant.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!isAvailable}
                  onClick={() => handleVariantSelect(variant)}
                  className={`
                    ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {sizeAttr.displayValue}
                  {variant.compare_at_price && variant.compare_at_price > variant.price && (
                    <span className="ml-2 text-xs">
                      {formatPrice(variant.compare_at_price - variant.price)}
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Material variants */}
      {materialVariants.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Materiál</h4>
          <div className="flex flex-wrap gap-2">
            {materialVariants.map((variant) => {
              if (!variant.attributes || !variant.attributes.material) return null
              
              const materialAttr = variant.attributes.material
              const stockStatus = getStockStatus(variant)
              const isSelected = selectedVariant?.id === variant.id
              const isAvailable = variant.status === 'active' && variant.inventory_quantity > 0
              
              return (
                <Button
                  key={variant.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!isAvailable}
                  onClick={() => handleVariantSelect(variant)}
                  className={`
                    ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {materialAttr.displayValue}
                  {variant.compare_at_price && variant.compare_at_price > variant.price && (
                    <span className="ml-2 text-xs">
                      {formatPrice(variant.compare_at_price - variant.price)}
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected variant info */}
      {selectedVariant && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">{selectedVariant.name}</h5>
              <p className="text-sm text-gray-600">
                SKU: {selectedVariant.sku}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(getFinalPrice(selectedVariant))}
              </div>
              <Badge 
                variant={
                  getStockStatus(selectedVariant).status === 'in-stock' ? 'default' :
                  getStockStatus(selectedVariant).status === 'low-stock' ? 'secondary' :
                  'destructive'
                }
                className="text-xs"
              >
                {getStockStatus(selectedVariant).label}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}