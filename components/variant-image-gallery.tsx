"use client"

import { useState, useEffect } from "react"
// import ImageGallery from 'react-image-gallery';
// import 'react-image-gallery/styles/css/image-gallery.css';
import { ProductVariant } from "../app/lib/types/variants"
import { getImageUrl } from "../app/lib/utils"

interface VariantImageGalleryProps {
  selectedVariant: (ProductVariant & { images?: (string | { image_url: string })[] }) | null
  baseImages: string[]
  productName: string
}

export default function VariantImageGallery({
  selectedVariant,
  baseImages,
  productName
}: VariantImageGalleryProps) {
  console.log('VariantImageGallery: Component Rendered'); // ADD THIS LINE
  const [galleryItems, setGalleryItems] = useState<any[]>([])

  useEffect(() => {
    let items: any[] = []
    
    console.log('🖼️ VariantImageGallery: Processing images');
    console.log('🔍 selectedVariant:', selectedVariant);
    console.log('🔍 baseImages:', baseImages);
    
    // RADICALLY SIMPLIFIED: Just use whatever images we get without any transformation
    try {
      // Priority 1: selectedVariant images (already processed by API)
      if (selectedVariant && (selectedVariant as any).images && Array.isArray((selectedVariant as any).images)) {
        const variantImages = (selectedVariant as any).images;
        console.log('✅ Using selectedVariant images (raw):', variantImages);
        
        items = variantImages
          .filter((img: any) => img && (typeof img === 'string' || img.image_url))
          .map((img: any) => {
            const url = typeof img === 'string' ? img : img.image_url;
            console.log('🔗 Direct URL use:', url);
            return {
              original: url,
              thumbnail: url,
              originalAlt: productName,
              thumbnailAlt: productName,
            };
          });
      }
      
      // Priority 2: baseImages (already processed by API)  
      if (items.length === 0 && baseImages && Array.isArray(baseImages)) {
        console.log('✅ Using baseImages (raw):', baseImages);
        
        items = baseImages
          .filter((img: string) => img && typeof img === 'string')
          .map((img: string) => {
            console.log('🔗 Direct URL use:', img);
            return {
              original: img,
              thumbnail: img,
              originalAlt: productName,
              thumbnailAlt: productName,
            };
          });
      }
      
      // Fallback: placeholder
      if (items.length === 0) {
        console.log('❌ No images found, using placeholder');
        items = [{
          original: '/placeholder.svg',
          thumbnail: '/placeholder.svg',
          originalAlt: 'No Image Available',
          thumbnailAlt: 'No Image Available',
        }];
      }
      
      console.log('🎯 Final gallery items:', items);
      
    } catch (error) {
      console.error('💥 Error processing images:', error);
      items = [{
        original: '/placeholder.svg',
        thumbnail: '/placeholder.svg',
        originalAlt: 'Error Loading Image',
        thumbnailAlt: 'Error Loading Image',
      }];
    }
    
    setGalleryItems(items);
  }, [selectedVariant, baseImages, productName])

  if (galleryItems.length === 0) {
    return (
      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center">
        <span className="text-gray-500">Žádné obrázky</span>
      </div>
    )
  }

  return (
    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
      <img
        src={galleryItems[0]?.original || '/placeholder.svg'}
        alt={galleryItems[0]?.originalAlt || 'Product image'}
        className="w-full h-full object-cover"
      />
    </div>
  )
}