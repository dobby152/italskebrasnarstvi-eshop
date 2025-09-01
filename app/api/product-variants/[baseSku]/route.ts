import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ baseSku: string }> }
) {
  try {
    const { baseSku } = await params

    if (!baseSku) {
      return NextResponse.json(
        { error: 'Base SKU is required' },
        { status: 400 }
      )
    }

    // Query for variants with the same base SKU pattern
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        products:product_id (
          id,
          name,
          description,
          brand,
          collection,
          images,
          image_url
        )
      `)
      .like('sku', `${baseSku}%`)
      .order('sku')

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform variants with image processing
    const transformedVariants = variants?.map((variant: any) => {
      let images = []
      
      if (variant.products?.images && Array.isArray(variant.products.images) && variant.products.images.length > 0) {
        images = variant.products.images.map((img: string) => {
          if (img.startsWith('http')) {
            return img
          }
          // Direct path to images - no processing needed
          if (img.startsWith('/images/')) {
            return img
          }
          return `/images/${img}`
        })
      } else if (variant.products?.image_url && variant.products.image_url.trim() !== '') {
        let imageUrl = variant.products.image_url
        if (imageUrl.startsWith('http')) {
          images = [imageUrl]
        } else {
          // Direct path to images - no processing needed
          if (imageUrl.startsWith('/images/')) {
            images = [imageUrl]
          } else {
            images = [`/images/${imageUrl}`]
          }
        }
      }

      return {
        ...variant,
        images,
        image_url: images[0] || null,
        productName: variant.products?.name,
        productBrand: variant.products?.brand,
        productCollection: variant.products?.collection
      }
    }) || []

    return NextResponse.json({
      baseSku,
      variants: transformedVariants,
      total: transformedVariants.length
    })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}