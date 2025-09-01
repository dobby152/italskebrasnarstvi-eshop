"use client"

import { useState, useEffect } from 'react'
import { Product } from '../lib/api-client'
import Link from 'next/link'
import { createProductSlug } from '../lib/utils'

interface ColorVariant {
  id: string | number
  sku: string
  name: string
  price: number
  colorCode: string
  colorName: string
  hexColor: string
  images: string[]
  availability: string
  stock?: number
}

interface ColorVariantSelectorProps {
  product: Product
  onVariantChange?: (variant: ColorVariant) => void
}

export default function ColorVariantSelector({ product, onVariantChange }: ColorVariantSelectorProps) {
  const [variants, setVariants] = useState<ColorVariant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Extract base SKU from product
  const baseSku = (product as any).baseSku || (product.sku?.split('-').slice(0, -1).join('-'))
  const currentColorCode = (product as any).colorCode

  useEffect(() => {
    if (!baseSku || !(product as any).hasVariants) return

    const fetchVariants = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/product-variants/${baseSku}`)
        const data = await response.json()
        
        if (data.variants && data.variants.length > 1) {
          // Convert new API format to ColorVariant format
          const colorVariants = data.variants?.map((variant: any) => ({
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            colorCode: variant.attributes?.color?.value || variant.colorCode,
            colorName: variant.attributes?.color?.displayValue || variant.colorName,
            hexColor: variant.attributes?.color?.hexColor || variant.hexColor,
            images: variant.images ? variant.images?.map((img: any) => img.image_url) : [],
            availability: variant.availability,
            stock: variant.inventory_quantity
          }))
          
          setVariants(colorVariants)
          setSelectedVariant(currentColorCode || colorVariants[0].colorCode)
        }
      } catch (error) {
        console.error('Error fetching variants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVariants()
  }, [baseSku, currentColorCode, (product as any).hasVariants])

  // Show loading state
  if (loading && (product as any).hasVariants) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600 mr-2">Barva:</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-200 animate-pulse" />
          <span className="text-sm text-gray-700">Načítání variant...</span>
        </div>
      </div>
    )
  }

  // Show single color if no variants or not hasVariants
  if (!baseSku || !(product as any).hasVariants || (!loading && variants.length <= 1)) {
    if ((product as any).hexColor) {
      return (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600 mr-2">Barva:</span>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: (product as any).hexColor }}
              title={(product as any).colorName}
            />
            <span className="text-sm text-gray-700">{(product as any).colorName}</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="mb-4">
      <span className="text-sm text-gray-600 block mb-2">Dostupné barvy:</span>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = selectedVariant === variant.colorCode
          const isCurrent = variant.id === product.id
          
          return (
            <div key={variant.id} className="flex flex-col items-center gap-1">
              {isCurrent ? (
                // Current product - not clickable
                <div
                  className={`w-8 h-8 rounded-full border-3 shadow-md ${
                    isSelected ? 'border-black' : 'border-gray-400'
                  }`}
                  style={{ backgroundColor: variant.hexColor }}
                  title={variant.colorName}
                />
              ) : (
                // Other variants - clickable color swatches (navigate on click)
                <Link 
                  href={`/produkt/${createProductSlug({
                    id: variant.id,
                    name: variant.name,
                    sku: variant.sku
                  } as Product)}`}
                  className={`w-8 h-8 rounded-full border-3 shadow-md hover:scale-110 transition-all cursor-pointer ${
                    isSelected ? 'border-black' : 'border-gray-400 hover:border-gray-600'
                  }`}
                  style={{ backgroundColor: variant.hexColor }}
                  title={`${variant.colorName} - ${variant.price.toLocaleString()} Kč`}
                />
              )}
              <span className="text-xs text-gray-500 text-center max-w-[60px] truncate">
                {variant.colorName}
              </span>
            </div>
          )
        })}
      </div>
      
      {variants.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {variants.length} barevných variant
        </div>
      )}
    </div>
  )
}