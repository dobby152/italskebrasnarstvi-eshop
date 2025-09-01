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
      .select(`
        *,
        product_images (
          id,
          image_path,
          alt_text,
          display_order
        ),
        product_variants (
          id,
          sku,
          title,
          option1_name,
          option1_value,
          option2_name,
          option2_value,
          option3_name,
          option3_value,
          price,
          compare_at_price,
          inventory_quantity,
          weight,
          created_at,
          updated_at
        )
      `)
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

    // Transform product with image processing
    let images = []
    if (product.product_images && product.product_images.length > 0) {
      images = product.product_images
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
    } else if (product.image_url && product.image_url.trim() !== '') {
      let imageUrl = product.image_url
      if (imageUrl.startsWith('http')) {
        images = [imageUrl]
      } else {
        let cleanPath = imageUrl
        if (cleanPath.startsWith('/images/')) {
          cleanPath = cleanPath.substring(8)
        } else if (cleanPath.startsWith('images/')) {
          cleanPath = cleanPath.substring(7)
        }
        images = [`/api/images/${cleanPath}`]
      }
    }

    const transformedProduct = {
      ...product,
      images,
      image_url: images[0] || null,
      hasVariants: product.product_variants && product.product_variants.length > 1
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