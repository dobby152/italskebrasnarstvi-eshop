"use client"

import { useState, useEffect } from "react"
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { ProductVariant } from "../app/lib/types/variants"
import { getImageUrl } from "../app/lib/utils"

interface VariantImageGalleryProps {
  selectedVariant: ProductVariant | null
  baseImages: string[]
  productName: string
}

export default function VariantImageGallery({
  selectedVariant,
  baseImages,
  productName
}: VariantImageGalleryProps) {
  const [galleryItems, setGalleryItems] = useState<any[]>([])

  useEffect(() => {
    let items: any[] = []
    
    console.log('VariantImageGallery: Props received:', { selectedVariant, baseImages, productName });
    
    try {
      if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
        console.log('VariantImageGallery: Using selectedVariant images:', selectedVariant.images);
        items = selectedVariant.images
          .filter((image) => image && image.image_url && typeof image.image_url === 'string')
          .map((image) => ({
            original: getImageUrl(image.image_url),
            thumbnail: getImageUrl(image.image_url),
            originalAlt: `${productName} - ${selectedVariant.name || 'Variant'}`,
            thumbnailAlt: `${productName} - ${selectedVariant.name || 'Variant'}`,
          }))
      } else if (baseImages && baseImages.length > 0) {
        console.log('VariantImageGallery: Falling back to baseImages:', baseImages);
        items = baseImages
          .filter((image) => image && typeof image === 'string' && image.trim() !== '')
          .map((image) => ({
            original: getImageUrl(image),
            thumbnail: getImageUrl(image),
            originalAlt: productName || 'Product Image',
            thumbnailAlt: productName || 'Product Image',
          }))
      }
      
      console.log('VariantImageGallery: Final items before setting state:', items);
      
      if (items.length === 0) {
        console.log('VariantImageGallery: No items found, using placeholder.');
        items = [{
          original: '/placeholder.svg',
          thumbnail: '/placeholder.svg',
          originalAlt: productName || 'No Image Available',
          thumbnailAlt: productName || 'No Image Available',
        }]
      }
    } catch (error) {
      console.error('Error processing images:', error)
      items = [{
        original: '/placeholder.svg',
        thumbnail: '/placeholder.svg',
        originalAlt: productName || 'Error Loading Image',
        thumbnailAlt: productName || 'Error Loading Image',
      }]
    }
    
    setGalleryItems(items)
  }, [selectedVariant, baseImages, productName])

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