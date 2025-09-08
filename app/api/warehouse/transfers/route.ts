import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getZasilatAPI } from '../../../lib/zasilat'

export async function GET(request: NextRequest) {
  try {
    // Get stock movements that are transfers between locations
    const { data: transfers, error } = await supabase
      .from('stock_movements')
      .select('*')
      .ilike('reason', '%převod%')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching transfers:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      transfers: transfers || []
    })

  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, from_location, to_location, notes, create_shipment = true } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    if (!from_location || !to_location) {
      return NextResponse.json(
        { error: 'Source and destination locations are required' },
        { status: 400 }
      )
    }

    if (from_location === to_location) {
      return NextResponse.json(
        { error: 'Source and destination locations must be different' },
        { status: 400 }
      )
    }

    const results = {
      processed: [],
      errors: [],
      shipment: null,
      totalTransferred: 0
    }

    // Process each item transfer
    for (const item of items) {
      try {
        const { sku, quantity } = item

        if (!sku || !quantity || quantity <= 0) {
          results.errors.push(`Invalid item data: ${JSON.stringify(item)}`)
          continue
        }

        // Get current inventory
        const { data: inventory, error: fetchError } = await supabase
          .from('inventory')
          .select('*')
          .eq('sku', sku)
          .single()

        if (fetchError) {
          results.errors.push(`Product ${sku} not found in inventory`)
          continue
        }

        const fromStockField = `${from_location}_stock`
        const toStockField = `${to_location}_stock`
        const currentFromStock = inventory[fromStockField] || 0
        const currentToStock = inventory[toStockField] || 0

        // Check if enough stock available
        if (currentFromStock < quantity) {
          results.errors.push(`Insufficient stock for ${sku}: available ${currentFromStock}, requested ${quantity}`)
          continue
        }

        // Update inventory - subtract from source, add to destination
        const newFromStock = currentFromStock - quantity
        const newToStock = currentToStock + quantity

        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            [fromStockField]: newFromStock,
            [toStockField]: newToStock,
            updated_at: new Date().toISOString()
          })
          .eq('sku', sku)

        if (updateError) {
          results.errors.push(`Failed to update inventory for ${sku}: ${updateError.message}`)
          continue
        }

        // Create stock movement records
        const transferReason = `Převod ${from_location} → ${to_location}${notes ? `: ${notes}` : ''}`
        
        // OUT movement from source
        await supabase.from('stock_movements').insert({
          sku,
          movement_type: 'out',
          quantity,
          location: from_location,
          reason: transferReason,
          user_id: 'system',
          created_at: new Date().toISOString()
        })

        // IN movement to destination
        await supabase.from('stock_movements').insert({
          sku,
          movement_type: 'in',
          quantity,
          location: to_location,
          reason: transferReason,
          user_id: 'system',
          created_at: new Date().toISOString()
        })

        results.processed.push({
          sku,
          quantity,
          from_location,
          to_location,
          status: 'success'
        })
        results.totalTransferred += quantity

      } catch (itemError) {
        console.error(`Error processing transfer for item ${item.sku}:`, itemError)
        results.errors.push(`Error processing ${item.sku}: ${itemError instanceof Error ? itemError.message : String(itemError)}`)
      }
    }

    // Create shipment via Zasilat API if requested and items were processed
    if (create_shipment && results.processed.length > 0) {
      try {
        // Get product names for processed items
        const processedSkus = results.processed.map(item => item.sku)
        const { data: products } = await supabase
          .from('products')
          .select('sku, name, name_cz')
          .in('sku', processedSkus)

        const itemsWithNames = results.processed.map(item => {
          const product = products?.find(p => p.sku === item.sku)
          return {
            sku: item.sku,
            name: product?.name_cz || product?.name || `Produkt ${item.sku}`,
            quantity: item.quantity
          }
        })

        const zasilat = getZasilatAPI()
        const shipmentResult = await zasilat.createTransfer({
          items: itemsWithNames,
          from_location,
          to_location,
          notes
        })

        results.shipment = shipmentResult
      } catch (shipmentError) {
        console.error('Error creating shipment:', shipmentError)
        // Don't fail the entire transfer if shipment creation fails
        results.errors.push(`Transfer completed but shipment creation failed: ${shipmentError instanceof Error ? shipmentError.message : String(shipmentError)}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Transferred ${results.totalTransferred} items successfully`,
      results
    })

  } catch (error) {
    console.error('Error processing transfer:', error)
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    )
  }
}