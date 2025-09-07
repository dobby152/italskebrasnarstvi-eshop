"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { formatPrice } from "../lib/utils"
import { ProductVariant } from "../lib/smart-variants"
import { useVariantsStock, useProductStock } from "../hooks/useStock"
import { stockService } from "../lib/stock-service"
import { AlertCircle, Package, Truck } from "lucide-react"
import OutOfStockOrderButton from "./out-of-stock-order-button"

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

  // Get real-time stock data for all variants
  const variantSkus = variants.map(v => v.sku)
  const { variants: stockVariants, loading: stockLoading } = useVariantsStock(variantSkus)
  
  // Get detailed stock for selected variant
  const { stock: selectedStock, loading: selectedStockLoading } = useProductStock(selectedVariant?.sku)

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    onVariantChange(variant)
  }

  useEffect(() => {
    // Update selected variant when variants change
    if (selectedSku && variants.length > 0) {
      const newSelected = variants.find(v => v.sku === selectedSku)
      if (newSelected && newSelected.sku !== selectedVariant?.sku) {
        setSelectedVariant(newSelected)
      }
    }
  }, [selectedSku, variants, selectedVariant?.sku])

  if (!variants || variants.length <= 1) {
    return null
  }

  // Get real stock status using the stock service
  const getStockStatus = (variant: ProductVariant) => {
    const stockVariant = stockVariants.find(s => s.sku === variant.sku)
    
    if (stockVariant) {
      const productStock = {
        sku: stockVariant.sku,
        totalStock: stockVariant.stock,
        locations: [],
        available: stockVariant.available,
        lowStock: stockVariant.stock <= 3,
        lastUpdated: new Date()
      }
      const stockInfo = stockService.getStockStatus(productStock)
      return {
        status: stockInfo.status,
        label: stockInfo.text,
        available: stockVariant.available,
        stock: stockVariant.stock
      }
    }
    
    // Fallback to variant data
    if (variant.availability === 'out_of_stock' || variant.stock <= 0) {
      return { status: 'out-of-stock' as const, label: 'Vyprodáno', available: false, stock: 0 }
    }
    if (variant.stock <= 3) {
      return { status: 'low-stock' as const, label: 'Málo skladem', available: true, stock: variant.stock }
    }
    return { status: 'in-stock' as const, label: 'Skladem', available: true, stock: variant.stock }
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
            const isAvailable = stockStatus.available
            const isLoading = stockLoading
            
            return (
              <Button
                key={variant.sku}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                disabled={!isAvailable || isLoading}
                onClick={() => handleVariantSelect(variant)}
                className={`
                  flex items-center gap-3 px-4 py-2 h-auto relative
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-md' : ''}
                  ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md transition-all'}
                  ${isLoading ? 'animate-pulse' : ''}
                `}
              >
                {/* Color circle with availability indicator */}
                <div className="relative">
                  <div 
                    className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${!isAvailable ? 'grayscale' : ''}`}
                    style={{ backgroundColor: variant.hexColor }}
                  />
                  {!isAvailable && (
                    <AlertCircle className="w-2 h-2 text-red-500 absolute -top-1 -right-1" />
                  )}
                  {stockStatus.status === 'low-stock' && isAvailable && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full border border-white absolute -top-1 -right-1"></div>
                  )}
                </div>
                
                {/* Color name */}
                <span className="font-medium">{variant.colorName}</span>
                
                {/* Stock info */}
                {!isLoading && (
                  <span className="text-xs text-gray-500">
                    ({stockStatus.stock}ks)
                  </span>
                )}
                
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
            const stockStatus = getStockStatus(variant)
            const isSelected = selectedVariant?.sku === variant.sku
            const isAvailable = stockStatus.available
            const isLoading = stockLoading
            
            return (
              <div
                key={variant.sku}
                onClick={() => isAvailable && !isLoading && handleVariantSelect(variant)}
                className={`
                  p-3 rounded-lg border-2 cursor-pointer transition-all relative
                  ${isSelected ? 
                    'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 
                    'border-gray-200 bg-white hover:border-gray-300'
                  }
                  ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isLoading ? 'animate-pulse' : ''}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <div 
                      className={`w-5 h-5 rounded-full border border-gray-300 ${!isAvailable ? 'grayscale' : ''}`}
                      style={{ backgroundColor: variant.hexColor }}
                    />
                    {!isAvailable && (
                      <AlertCircle className="w-3 h-3 text-red-500 absolute -top-1 -right-1 bg-white rounded-full" />
                    )}
                    {stockStatus.status === 'low-stock' && isAvailable && (
                      <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white absolute -top-1 -right-1"></div>
                    )}
                  </div>
                  <span className="font-medium text-sm">{variant.colorName}</span>
                </div>
                
                <div className="text-xs text-gray-600 mb-2">
                  {variant.colorCode} • {formatPrice(variant.price)}
                  {!isLoading && ` • ${stockStatus.stock}ks`}
                </div>
                
                <Badge 
                  variant={
                    stockStatus.status === 'in-stock' ? 'default' :
                    stockStatus.status === 'low-stock' ? 'secondary' :
                    stockStatus.status === 'limited-stock' ? 'outline' :
                    'destructive'
                  }
                  className="text-xs"
                >
                  {isLoading ? 'Načítám...' : stockStatus.label}
                </Badge>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected variant info with real stock data */}
      {selectedVariant && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div 
                  className={`w-6 h-6 rounded-full border-2 border-white shadow ${!getStockStatus(selectedVariant).available ? 'grayscale' : ''}`}
                  style={{ backgroundColor: selectedVariant.hexColor }}
                />
                {!getStockStatus(selectedVariant).available && (
                  <AlertCircle className="w-3 h-3 text-red-500 absolute -top-1 -right-1 bg-white rounded-full" />
                )}
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">{selectedVariant.colorName}</h5>
                <p className="text-sm text-gray-600">SKU: {selectedVariant.sku}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">
                {formatPrice(selectedVariant.price)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={
                    getStockStatus(selectedVariant).status === 'in-stock' ? 'default' :
                    getStockStatus(selectedVariant).status === 'low-stock' ? 'secondary' :
                    getStockStatus(selectedVariant).status === 'limited-stock' ? 'outline' :
                    'destructive'
                  }
                  className="text-xs"
                >
                  {selectedStockLoading ? 'Načítám...' : getStockStatus(selectedVariant).label}
                </Badge>
                {!selectedStockLoading && selectedStock && (
                  <span className="text-xs text-gray-500">
                    {selectedStock.totalStock}ks celkem
                  </span>
                )}
              </div>
              
              {/* Branch availability */}
              {selectedStock && selectedStock.locations.length > 1 && (
                <div className="mt-2 space-y-1">
                  {selectedStock.locations.map((location, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600">{location.location}</span>
                      </div>
                      <span className="font-medium text-gray-900">{location.stock}ks</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Out of stock order button */}
          {selectedVariant && !getStockStatus(selectedVariant).available && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <h5 className="font-medium text-orange-800 mb-2">Produkt není skladem</h5>
              <p className="text-sm text-orange-700 mb-3">
                Můžete si objednat informaci o dostupnosti. Budeme vás kontaktovat, 
                jakmile bude produkt k dispozici.
              </p>
              <OutOfStockOrderButton
                productSku={selectedVariant.sku}
                productName={selectedVariant.name}
                colorVariant={selectedVariant.colorCode}
                colorName={selectedVariant.colorName}
                price={selectedVariant.price}
                size="sm"
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}