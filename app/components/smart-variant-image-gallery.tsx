"use client"

import { useState, useEffect } from "react"
// @ts-ignore - react-image-gallery doesn't have types
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { ProductVariant } from "../lib/smart-variants"
import { getImageUrl } from '../../lib/utils'

interface SmartVariantImageGalleryProps {
  selectedVariant: ProductVariant | null
  allVariants: ProductVariant[]
  baseImages: string[]
  productName: string
}

export default function SmartVariantImageGallery({
  selectedVariant,
  allVariants,
  baseImages,
  productName
}: SmartVariantImageGalleryProps) {
  const [galleryItems, setGalleryItems] = useState<any[]>([])

  /**
   * Filter images by color code from image filenames
   * Italian leather goods typically have images like:
   * - "1_BD6657W92-AZBE2_1.jpg" (AZBE2 = Azure Blue)
   * - "2_BD6657W92-R_DETT1.jpg" (R = Rose)
   * - "3_BD6657W92-GR_1.jpg" (GR = Grey)
   */
  const filterImagesByColor = (images: string[], colorCode: string): string[] => {
    if (!colorCode || colorCode === 'DEFAULT') {
      return images // Return all images for default
    }

    // Try to find images that contain the color code in filename
    const colorFilteredImages = images.filter(image => {
      if (!image || typeof image !== 'string') return false
      
      // Extract filename from path
      const filename = image.split('/').pop() || image
      
      // Check if color code appears in filename
      // Examples: BD6657W92-AZBE2, CA1234-R, AC5290BM-GR
      const colorPattern = new RegExp(`[-_]${colorCode.toUpperCase()}[-_.]`, 'i')
      const hasColor = colorPattern.test(filename)
      
      console.log(`🎨 Image: ${filename}, Color: ${colorCode}, Match: ${hasColor}`)
      
      return hasColor
    })

    // If we found color-specific images, use them
    if (colorFilteredImages.length > 0) {
      console.log(`✅ Found ${colorFilteredImages.length} images for color ${colorCode}`)
      return colorFilteredImages
    }

    // Fallback: if no color-specific images found, return all images
    console.log(`⚠️ No images found for color ${colorCode}, using all images`)
    return images
  }

  useEffect(() => {
    let items: any[] = []
    
    try {
      let imagesToUse: string[] = []

      if (selectedVariant) {
        console.log(`🔍 Processing images for variant: ${selectedVariant.sku} (${selectedVariant.colorName})`)
        
        // Strategy 1: Use variant-specific images if available
        if (selectedVariant.images && selectedVariant.images.length > 0) {
          imagesToUse = selectedVariant.images
          console.log(`📸 Using variant-specific images: ${imagesToUse.length}`)
        }
        
        // Strategy 2: Filter base images by color if no variant images
        else if (baseImages && baseImages.length > 0) {
          imagesToUse = filterImagesByColor(baseImages, selectedVariant.colorCode)
          console.log(`🎨 Filtered images by color ${selectedVariant.colorCode}: ${imagesToUse.length}`)
        }

        // Strategy 3: Look for images in other variants with same color
        else if (allVariants && allVariants.length > 0) {
          const sameColorVariant = allVariants.find(v => 
            v.colorCode === selectedVariant.colorCode && 
            v.images && 
            v.images.length > 0
          )
          
          if (sameColorVariant) {
            imagesToUse = sameColorVariant.images
            console.log(`🔄 Using images from same-color variant: ${imagesToUse.length}`)
          }
        }
      }

      // Fallback to base images if nothing found
      if (imagesToUse.length === 0 && baseImages && baseImages.length > 0) {
        imagesToUse = baseImages
        console.log(`🔙 Fallback to base images: ${imagesToUse.length}`)
      }

      // Convert to gallery format
      if (imagesToUse.length > 0) {
        items = imagesToUse
          .filter((image) => image && typeof image === 'string' && image.trim() !== '')
          .map((image, index) => ({
            original: getImageUrl(image),
            thumbnail: getImageUrl(image),
            originalAlt: `${productName} - ${selectedVariant?.colorName || 'Variant'} ${index + 1}`,
            thumbnailAlt: `${productName} - ${selectedVariant?.colorName || 'Variant'} ${index + 1}`,
          }))
      }
      
      // Ultimate fallback: placeholder
      if (items.length === 0) {
        items = [{
          original: '/placeholder.svg',
          thumbnail: '/placeholder.svg',
          originalAlt: productName || 'No Image Available',
          thumbnailAlt: productName || 'No Image Available',
        }]
        console.log('📷 Using placeholder image')
      }

      console.log(`🖼️ Final gallery items: ${items.length}`)
      
    } catch (error) {
      console.error('Error processing variant images:', error)
      // Error fallback
      items = [{
        original: '/placeholder.svg',
        thumbnail: '/placeholder.svg',
        originalAlt: productName || 'Error Loading Image',
        thumbnailAlt: productName || 'Error Loading Image',
      }]
    }
    
    setGalleryItems(items)
  }, [selectedVariant, allVariants, baseImages, productName])

  if (galleryItems.length === 0) {
    return (
      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center">
        <span className="text-gray-500">Načítání obrázků...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Color indicator */}
      {selectedVariant && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div 
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: selectedVariant.hexColor }}
          />
          <span>Zobrazené obrázky pro barvu: {selectedVariant.colorName}</span>
        </div>
      )}
      
      <ImageGallery
        items={galleryItems}
        showPlayButton={false}
        showFullscreenButton={true}
        slideDuration={300}
        slideInterval={5000}
        showThumbnails={galleryItems.length > 1}
        thumbnailPosition="bottom"
      />
    </div>
  )
}