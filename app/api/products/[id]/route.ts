import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Transform product with image processing (same logic as products route)
    let images = []
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      images = product.images.map((img: string) => {
        if (img.startsWith('http')) {
          return img
        }
        // Direct path to images - no processing needed
        if (img.startsWith('/images/')) {
          return img
        }
        
        // The database contains folder-relative paths like "folder-name/image.jpg"
        // Convert to full path /images/folder-relative-path
        if (img.includes('/') && !img.startsWith('/')) {
          return `/images/${img}`
        }
        
        // Handle api/ prefix
        if (img.startsWith('api/')) {
          return `/images/${img.substring(4)}`
        }
        
        // If it's just a folder name, try to construct path to first image
        // Pattern: /images/folder-name/1_FOLDER_NAME_1.jpg
        const folderName = img
        const imageFileName = `1_${folderName.toUpperCase().replace(/-/g, '_')}_1.jpg`
        return `/images/${folderName}/${imageFileName}`
      })
    } else if (product.image_url && product.image_url.trim() !== '') {
      let imageUrl = product.image_url
      if (imageUrl.startsWith('http')) {
        images = [imageUrl]
      } else {
        // Direct path to images - no processing needed
        if (imageUrl.startsWith('/images/')) {
          images = [imageUrl]
        } else if (imageUrl.startsWith('api/')) {
          images = [`/images/${imageUrl.substring(4)}`]
        } else if (imageUrl.includes('/') && !imageUrl.startsWith('/')) {
          // Database contains folder-relative path
          images = [`/images/${imageUrl}`]
        } else {
          // If it's a folder name, try to construct path to first image
          const folderName = imageUrl
          const imageFileName = `1_${folderName.toUpperCase().replace(/-/g, '_')}_1.jpg`
          images = [`/images/${folderName}/${imageFileName}`]
        }
      }
    }

    const transformedProduct = {
      ...product,
      images,
      image_url: images[0] || null,
      brand: product.normalized_brand || null,
      collection: product.normalized_collection || null,
      hasVariants: false
    }

    return NextResponse.json(transformedProduct)

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}