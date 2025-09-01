"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { formatPrice } from "../lib/utils"
import { ProductVariant } from "../lib/smart-variants"

interface SmartColorVariantSelectorProps {
  variants: ProductVariant[]
  selectedSku?: string
  onVariantChange: (variant: ProductVariant) => void
}

export default function SmartColorVariantSelector({
  variants,
  selectedSku,
  onVariantChange
}: SmartColorVariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.find(v => v.sku === selectedSku) || variants[0] || null
  )

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    onVariantChange(variant)
  }

  if (!variants || variants.length <= 1) {
    return null
  }

  const getStockStatus = (variant: ProductVariant) => {
    if (variant.availability === 'out_of_stock') return { status: 'out-of-stock', label: 'Vyprodáno' }
    if (variant.stock <= 3) return { status: 'low-stock', label: 'Málo skladem' }
    return { status: 'in-stock', label: 'Skladem' }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          Dostupné barvy ({variants.length})
        </h4>
        
        {/* Color variant buttons */}
        <div className="flex flex-wrap gap-3">
          {variants.map((variant) => {
            const stockStatus = getStockStatus(variant)
            const isSelected = selectedVariant?.sku === variant.sku
            const isAvailable = variant.availability === 'in_stock' && variant.stock > 0
            
            return (
              <Button
                key={variant.sku}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                disabled={!isAvailable}
                onClick={() => handleVariantSelect(variant)}
                className={`
                  flex items-center gap-3 px-4 py-2 h-auto
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-md' : ''}
                  ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md transition-all'}
                `}
              >
                {/* Color circle */}
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: variant.hexColor }}
                />
                
                {/* Color name */}
                <span className="font-medium">{variant.colorName}</span>
                
                {/* Price difference if any */}
                {variant.price !== selectedVariant?.price && (
                  <span className="text-xs text-gray-500">
                    {formatPrice(variant.price)}
                  </span>
                )}
              </Button>
            )
          })}
        </div>
        
        {/* Variant grid display (alternative) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {variants.map((variant) => {
            const isSelected = selectedVariant?.sku === variant.sku
            const isAvailable = variant.availability === 'in_stock' && variant.stock > 0
            
            return (
              <div
                key={variant.sku}
                onClick={() => isAvailable && handleVariantSelect(variant)}
                className={`
                  p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected ? 
                    'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 
                    'border-gray-200 bg-white hover:border-gray-300'
                  }
                  ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-5 h-5 rounded-full border border-gray-300"
                    style={{ backgroundColor: variant.hexColor }}
                  />
                  <span className="font-medium text-sm">{variant.colorName}</span>
                </div>
                
                <div className="text-xs text-gray-600">
                  {variant.colorCode} • {formatPrice(variant.price)}
                </div>
                
                <Badge 
                  size="sm"
                  variant={
                    getStockStatus(variant).status === 'in-stock' ? 'default' :
                    getStockStatus(variant).status === 'low-stock' ? 'secondary' :
                    'destructive'
                  }
                  className="mt-1 text-xs"
                >
                  {getStockStatus(variant).label}
                </Badge>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected variant info */}
      {selectedVariant && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: selectedVariant.hexColor }}
              />
              <div>
                <h5 className="font-semibold text-gray-900">{selectedVariant.colorName}</h5>
                <p className="text-sm text-gray-600">SKU: {selectedVariant.sku}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">
                {formatPrice(selectedVariant.price)}
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