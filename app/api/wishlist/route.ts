import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to get user from token
async function getUserFromToken(authToken: string | null) {
  if (!authToken) return null
  
  try {
    const token = authToken.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const userId = await getUserFromToken(authToken)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    // Get user's wishlists with items
    const { data: wishlists, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        wishlist_items (
          id,
          product:products (
            id,
            title,
            handle,
            price,
            compare_at_price,
            product_images (
              id,
              src,
              alt_text,
              position
            ),
            product_variants (
              id,
              sku,
              price,
              compare_at_price,
              inventory_quantity
            )
          )
        )
      `)
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Wishlist load error:', error)
      return NextResponse.json(
        { error: 'Failed to load wishlists' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ wishlists })
    
  } catch (error) {
    console.error('Wishlist load error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')
    const { action, name, productId, wishlistId } = await request.json()
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const userId = await getUserFromToken(authToken)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    if (action === 'create') {
      // Create new wishlist
      const { data: newWishlist, error } = await supabase
        .from('wishlists')
        .insert({
          customer_id: userId,
          name: name || 'Nový wishlist',
          is_default: false
        })
        .select()
        .single()
      
      if (error) {
        console.error('Wishlist creation error:', error)
        return NextResponse.json(
          { error: 'Failed to create wishlist' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ wishlist: newWishlist })
    }
    
    if (action === 'add' && productId) {
      // Add product to wishlist
      let targetWishlistId = wishlistId
      
      if (!targetWishlistId) {
        // Get default wishlist
        const { data: defaultWishlist } = await supabase
          .from('wishlists')
          .select('id')
          .eq('customer_id', userId)
          .eq('is_default', true)
          .single()
        
        if (defaultWishlist) {
          targetWishlistId = defaultWishlist.id
        } else {
          // Create default wishlist if it doesn't exist
          const { data: newWishlist, error } = await supabase
            .from('wishlists')
            .insert({
              customer_id: userId,
              name: 'Má wishlist',
              is_default: true
            })
            .select()
            .single()
          
          if (error) {
            console.error('Default wishlist creation error:', error)
            return NextResponse.json(
              { error: 'Failed to create default wishlist' },
              { status: 500 }
            )
          }
          
          targetWishlistId = newWishlist.id
        }
      }
      
      // Check if product is already in wishlist
      const { data: existingItem } = await supabase
        .from('wishlist_items')
        .select('id')
        .eq('wishlist_id', targetWishlistId)
        .eq('product_id', productId)
        .single()
      
      if (existingItem) {
        return NextResponse.json(
          { error: 'Product already in wishlist' },
          { status: 409 }
        )
      }
      
      // Add product to wishlist
      const { error } = await supabase
        .from('wishlist_items')
        .insert({
          wishlist_id: targetWishlistId,
          product_id: productId
        })
      
      if (error) {
        console.error('Wishlist item creation error:', error)
        return NextResponse.json(
          { error: 'Failed to add product to wishlist' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ message: 'Product added to wishlist successfully' })
    }
    
    if (action === 'remove' && productId && wishlistId) {
      // Remove product from wishlist
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('wishlist_id', wishlistId)
        .eq('product_id', productId)
      
      if (error) {
        console.error('Wishlist item removal error:', error)
        return NextResponse.json(
          { error: 'Failed to remove product from wishlist' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ message: 'Product removed from wishlist successfully' })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Wishlist operation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}