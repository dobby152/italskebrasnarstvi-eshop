import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// GET /api/variants - Načte všechny base products s jejich variantami
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const baseProductId = searchParams.get('baseProductId')
    const baseSku = searchParams.get('baseSku')

    if (baseProductId) {
      // Načtení konkrétního base product s variantami
      const { data: baseProduct, error: baseError } = await supabase
        .from('base_products')
        .select('*')
        .eq('id', baseProductId)
        .single()

      if (baseError) {
        throw baseError
      }

      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select(`
          *,
          products (*),
          variant_images (*)
        `)
        .eq('base_product_id', baseProductId)
        .order('id')

      if (variantsError) {
        throw variantsError
      }

      return NextResponse.json({
        baseProduct,
        variants,
        success: true
      })
    }

    if (baseSku) {
      // Načtení podle base SKU
      const { data: baseProduct, error: baseError } = await supabase
        .from('base_products')
        .select('*')
        .eq('base_sku', baseSku)
        .single()

      if (baseError) {
        // If no base product found, return empty result instead of error
        if (baseError.code === 'PGRST116') {
          return NextResponse.json({
            baseProduct: null,
            variants: [],
            success: true
          })
        }
        throw baseError
      }

      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select(`
          *,
          products (*),
          variant_images (*)
        `)
        .eq('base_product_id', baseProduct.id)
        .order('id')

      if (variantsError) {
        throw variantsError
      }

      return NextResponse.json({
        baseProduct,
        variants,
        success: true
      })
    }

    // Načtení všech base products s počtem variant
    const { data: baseProducts, error } = await supabase
      .from('base_products')
      .select(`
        *,
        product_variants (count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      baseProducts,
      success: true
    })

  } catch (error) {
    console.error('Error fetching variants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variants', success: false },
      { status: 500 }
    )
  }
}

