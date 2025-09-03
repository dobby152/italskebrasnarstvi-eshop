"use client"

import { useState, useEffect } from "react"
// @ts-ignore - react-image-gallery doesn't have types
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { ProductVariant } from "../lib/types/variants"
import { getImageUrl } from "../lib/utils"

interface VariantImageGalleryProps {
  selectedVariant: ProductVariant | null
  baseImages: string[]
  baseImageUrl?: string | null
  productName: string
}

export default function VariantImageGallery({
  selectedVariant,
  baseImages,
  baseImageUrl,
  productName
}: VariantImageGalleryProps) {
  const [galleryItems, setGalleryItems] = useState<any[]>([])

  useEffect(() => {
    let items: any[] = []
    
    try {
      let allImages: string[] = [];

      if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
        allImages = selectedVariant.images.map(img => img.image_url).filter(Boolean) as string[];
      } else {
        allImages = [...baseImages];
        if (baseImageUrl && !allImages.includes(baseImageUrl)) {
          allImages.unshift(baseImageUrl); // Add main image to the start
        }
      }

      if (allImages.length > 0) {
        items = allImages
          .filter((image) => image && typeof image === 'string' && image.trim() !== '')
          .map((image) => ({
            original: getImageUrl(image),
            thumbnail: getImageUrl(image),
            originalAlt: productName || 'Product Image',
            thumbnailAlt: productName || 'Product Image',
          }));
      }
      
      // If no items found, add a placeholder
      if (items.length === 0) {
        items = [{
          original: '/placeholder.svg',
          thumbnail: '/placeholder.svg',
          originalAlt: productName || 'No Image Available',
          thumbnailAlt: productName || 'No Image Available',
        }]
      }
    } catch (error) {
      console.error('Error processing images:', error)
      // Fallback to placeholder
      items = [{
        original: '/placeholder.svg',
        thumbnail: '/placeholder.svg',
        originalAlt: productName || 'Error Loading Image',
        thumbnailAlt: productName || 'Error Loading Image',
      }]
    }
    
    setGalleryItems(items)
  }, [selectedVariant, baseImages, baseImageUrl, productName])

  if (galleryItems.length === 0) {
    return (
      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center">
        <span className="text-gray-500">Žádné obrázky</span>
      </div>
    )
  }

  return (
    <ImageGallery
      items={galleryItems}
      showPlayButton={false}
      showFullscreenButton={true}
      slideDuration={300}
    />
  )
}