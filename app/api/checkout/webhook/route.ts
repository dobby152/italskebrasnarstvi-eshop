import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/app/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
        
      default:
        console.log(`Unhandled event type ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id)
  
  // Update checkout session status
  await supabase
    .from('checkout_sessions')
    .update({ status: 'completed' })
    .eq('stripe_session_id', session.id)
  
  // Create order
  const { data: checkoutSession } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('stripe_session_id', session.id)
    .single()
  
  if (!checkoutSession) {
    console.error('Checkout session not found:', session.id)
    return
  }
  
  // Get cart with items
  const { data: cart } = await supabase
    .from('carts')
    .select(`
      *,
      cart_items (
        *,
        product_variant:product_variants (
          *,
          product:products (*)
        )
      )
    `)
    .eq('id', checkoutSession.cart_id)
    .single()
  
  if (!cart) {
    console.error('Cart not found:', checkoutSession.cart_id)
    return
  }
  
  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: checkoutSession.customer_id,
      status: 'paid',
      currency: session.currency?.toUpperCase() || 'CZK',
      subtotal_price: session.amount_subtotal ? session.amount_subtotal / 100 : 0,
      total_price: session.amount_total ? session.amount_total / 100 : 0,
      shipping_address: (session as any).shipping_details?.address ? {
        name: (session as any).shipping_details.name,
        line1: (session as any).shipping_details.address.line1,
        line2: (session as any).shipping_details.address.line2,
        city: (session as any).shipping_details.address.city,
        postal_code: (session as any).shipping_details.address.postal_code,
        country: (session as any).shipping_details.address.country
      } : null,
      payment_id: session.payment_intent as string,
      payment_status: 'paid',
      fulfillment_status: 'unfulfilled'
    })
    .select()
    .single()
  
  if (orderError) {
    console.error('Order creation error:', orderError)
    return
  }
  
  // Create order items and reduce inventory
  for (const cartItem of cart.cart_items) {
    // Create order item
    await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_variant_id: cartItem.product_variant_id,
        quantity: cartItem.quantity,
        price: cartItem.product_variant.price
      })
    
    // Reduce inventory
    await supabase
      .from('product_variants')
      .update({
        inventory_quantity: Math.max(0, cartItem.product_variant.inventory_quantity - cartItem.quantity)
      })
      .eq('id', cartItem.product_variant_id)
  }
  
  // Mark cart as completed
  await supabase
    .from('carts')
    .update({ status: 'completed' })
    .eq('id', cart.id)
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  console.log('Checkout expired:', session.id)
  
  await supabase
    .from('checkout_sessions')
    .update({ status: 'expired' })
    .eq('stripe_session_id', session.id)
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)
  
  // Update order payment status if needed
  await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('payment_id', paymentIntent.id)
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id)
  
  // Update order payment status
  await supabase
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('payment_id', paymentIntent.id)
}