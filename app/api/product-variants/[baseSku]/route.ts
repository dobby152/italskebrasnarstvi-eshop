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
          product_images (
            id,
            image_path,
            alt_text,
            display_order
          )
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
      
      if (variant.products?.product_images && variant.products.product_images.length > 0) {
        images = variant.products.product_images
          .sort((a: any, b: any) => (a.display_order || 999) - (b.display_order || 999))
          ?.map((img: any) => {
            let cleanPath = img.image_path
            if (cleanPath.startsWith('/images/')) {
              cleanPath = cleanPath.substring(8)
            } else if (cleanPath.startsWith('images/')) {
              cleanPath = cleanPath.substring(7)
            }
            return `/api/images/${cleanPath}`
          })
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