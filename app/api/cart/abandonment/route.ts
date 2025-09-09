import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { sanitizeString, sanitizeNumber, getSecurityHeaders } from '@/app/lib/security'

interface CartAbandonmentData {
  sessionId: string
  userId?: string
  email?: string
  cartItems: {
    productId: string
    productName: string
    quantity: number
    price: number
    sku: string
    imageUrl?: string
  }[]
  totalValue: number
  lastActivity: string
  exitIntent?: boolean
  timeOnPage?: number
  source?: string
}

interface AbandonmentTrigger {
  type: 'exit_intent' | 'time_threshold' | 'manual_save'
  message: string
  discountOffer?: {
    percentage: number
    code: string
    validUntil: string
  }
}

// Save abandoned cart
export async function POST(request: NextRequest) {
  try {
    const data: CartAbandonmentData = await request.json()
    
    const {
      sessionId,
      userId,
      email,
      cartItems,
      totalValue,
      lastActivity,
      exitIntent = false,
      timeOnPage = 0,
      source = 'website'
    } = data

    if (!sessionId || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Check if cart is worth saving (minimum value threshold)
    const minCartValue = 500 // 500 CZK
    if (totalValue < minCartValue) {
      return NextResponse.json(
        { saved: false, reason: 'Below minimum cart value' },
        { headers: getSecurityHeaders() }
      )
    }

    // Save abandoned cart
    const { data: savedCart, error } = await supabase
      .from('abandoned_carts')
      .upsert({
        session_id: sanitizeString(sessionId),
        user_id: userId || null,
        customer_email: email ? sanitizeString(email) : null,
        cart_items: cartItems,
        total_value: sanitizeNumber(totalValue, 0),
        last_activity: lastActivity,
        exit_intent: exitIntent,
        time_on_page: sanitizeNumber(timeOnPage, 0),
        source: sanitizeString(source),
        status: 'abandoned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving abandoned cart:', error)
      return NextResponse.json(
        { error: 'Failed to save cart' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Generate personalized recovery offer
    const recoveryOffer = generateRecoveryOffer(totalValue, cartItems.length, exitIntent)

    // Schedule recovery emails if email is available
    if (email && savedCart) {
      await scheduleRecoveryEmails(savedCart.id, email, recoveryOffer)
    }

    // Log abandonment analytics
    await supabase
      .from('cart_abandonment_analytics')
      .insert({
        cart_id: savedCart.id,
        abandonment_type: exitIntent ? 'exit_intent' : 'time_based',
        cart_value: totalValue,
        items_count: cartItems.length,
        time_on_page: timeOnPage,
        recovery_offer: recoveryOffer.discountOffer?.percentage || 0,
        created_at: new Date().toISOString()
      })

    const response = NextResponse.json({
      saved: true,
      cartId: savedCart.id,
      recoveryOffer,
      message: 'Váš košík byl uložen'
    })

    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error) {
    console.error('Cart abandonment API error:', error)
    return NextResponse.json(
      { error: 'Failed to process cart abandonment' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

// Get abandoned cart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const cartId = searchParams.get('cartId')
    const email = searchParams.get('email')

    if (!sessionId && !cartId && !email) {
      return NextResponse.json(
        { error: 'Missing identifier' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    let query = supabase.from('abandoned_carts').select('*')

    if (cartId) {
      query = query.eq('id', cartId)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    } else if (email) {
      query = query.eq('customer_email', email)
    }

    const { data: cart, error } = await query
      .eq('status', 'abandoned')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !cart) {
      return NextResponse.json(
        { found: false },
        { headers: getSecurityHeaders() }
      )
    }

    // Check if cart is still valid (not too old)
    const cartAge = Date.now() - new Date(cart.updated_at).getTime()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    
    if (cartAge > maxAge) {
      return NextResponse.json(
        { found: false, reason: 'Cart expired' },
        { headers: getSecurityHeaders() }
      )
    }

    // Generate fresh recovery offer
    const recoveryOffer = generateRecoveryOffer(
      cart.total_value, 
      cart.cart_items?.length || 0, 
      cart.exit_intent
    )

    const response = NextResponse.json({
      found: true,
      cart: {
        id: cart.id,
        items: cart.cart_items,
        totalValue: cart.total_value,
        lastActivity: cart.last_activity,
        recoveryOffer
      }
    })

    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error) {
    console.error('Get abandoned cart error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve cart' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

// Mark cart as recovered
export async function PUT(request: NextRequest) {
  try {
    const { cartId, orderId } = await request.json()

    if (!cartId) {
      return NextResponse.json(
        { error: 'Missing cart ID' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    await supabase
      .from('abandoned_carts')
      .update({
        status: 'recovered',
        recovered_at: new Date().toISOString(),
        order_id: orderId || null
      })
      .eq('id', cartId)

    // Log recovery analytics
    await supabase
      .from('cart_abandonment_analytics')
      .update({
        recovered: true,
        recovered_at: new Date().toISOString()
      })
      .eq('cart_id', cartId)

    return NextResponse.json(
      { success: true },
      { headers: getSecurityHeaders() }
    )

  } catch (error) {
    console.error('Mark cart recovered error:', error)
    return NextResponse.json(
      { error: 'Failed to mark cart as recovered' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

function generateRecoveryOffer(cartValue: number, itemCount: number, exitIntent: boolean): AbandonmentTrigger {
  let discountPercentage = 0
  let message = 'Vrátit se k nákupu'

  // Calculate discount based on cart value and behavior
  if (exitIntent && cartValue > 2000) {
    discountPercentage = 15
    message = '15% sleva na váš košík! Nabídka platí 24 hodin.'
  } else if (cartValue > 1500) {
    discountPercentage = 10
    message = '10% sleva při dokončení objednávky dnes!'
  } else if (cartValue > 1000) {
    discountPercentage = 5
    message = '5% sleva na váš košík!'
  } else if (itemCount >= 3) {
    discountPercentage = 10
    message = '10% sleva při nákupu 3+ položek!'
  }

  const offer: AbandonmentTrigger = {
    type: exitIntent ? 'exit_intent' : 'time_threshold',
    message
  }

  if (discountPercentage > 0) {
    const discountCode = `SAVE${discountPercentage}${Date.now().toString().slice(-4)}`
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    
    offer.discountOffer = {
      percentage: discountPercentage,
      code: discountCode,
      validUntil
    }

    // Save discount code
    supabase
      .from('discount_codes')
      .insert({
        code: discountCode,
        discount_percentage: discountPercentage,
        valid_until: validUntil,
        single_use: true,
        created_for: 'cart_abandonment',
        created_at: new Date().toISOString()
      })

  // Log discount code creation
  console.log(`Created discount code: ${discountCode}`)
  }

  return offer
}

async function scheduleRecoveryEmails(cartId: string, email: string, offer: AbandonmentTrigger) {
  // Schedule recovery email sequence
  const emailSchedules = [
    { delay: 1, title: 'Nezapomeňte na váš košík' },
    { delay: 24, title: 'Stále váš čeká' },
    { delay: 72, title: 'Poslední šance na slevu' }
  ]

  for (const schedule of emailSchedules) {
    const sendAt = new Date(Date.now() + schedule.delay * 60 * 60 * 1000)
    
    await supabase
      .from('email_queue')
      .insert({
        recipient_email: email,
        template: 'cart_abandonment',
        template_data: {
          cartId,
          recoveryOffer: offer,
          title: schedule.title
        },
        send_at: sendAt.toISOString(),
        status: 'queued',
        created_at: new Date().toISOString()
      })
  }
}