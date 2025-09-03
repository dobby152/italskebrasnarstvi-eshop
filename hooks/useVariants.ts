'use client'

import { useState, useEffect, useCallback } from 'react'
import { VariantGroup, ProductVariant, BaseProduct } from '@/lib/types/variants'
import { apiClient } from '@/lib/api-client'

export interface UseVariantsReturn {
  variantGroup: VariantGroup | null
  loading: boolean
  error: string | null
  selectedVariant: ProductVariant | null
  setSelectedVariant: (variant: ProductVariant) => void
  fetchVariantGroup: (baseSku: string) => Promise<void>
}

export function useVariants(): UseVariantsReturn {
  const [variantGroup, setVariantGroup] = useState<VariantGroup | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVariantGroup = useCallback(async (baseSku: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await apiClient.getVariantsByBaseSku(baseSku)
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch variant data')
      }
      
      const newVariantGroup: VariantGroup = {
        baseProduct: data.baseProduct,
        variants: data.variants
      }
      
      setVariantGroup(newVariantGroup)
      
      // Set the first variant as selected by default
      if (data.variants && data.variants.length > 0) {
        const firstVariant = data.variants[0];
        const mappedVariant: ProductVariant = {
          ...firstVariant,
          images: firstVariant.images ? firstVariant.images.map((url: string, index: number) => ({
            id: index, // Assign a dummy ID
            variant_id: firstVariant.id, // Use the variant's ID
            image_url: url,
            alt_text: firstVariant.name, // Use product name as alt text
            sort_order: index,
            is_featured: index === 0, // First image as featured
            image_type: 'product' // Default type
          })) : []
        };
        setSelectedVariant(mappedVariant);
      }
    } catch (err) {
      console.error('Error fetching variant data:', err)
      setError(err instanceof Error ? err.message : 'Chyba při načítání variant')
      setVariantGroup(null)
      setSelectedVariant(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    variantGroup,
    loading,
    error,
    selectedVariant,
    setSelectedVariant,
    fetchVariantGroup
  }
}