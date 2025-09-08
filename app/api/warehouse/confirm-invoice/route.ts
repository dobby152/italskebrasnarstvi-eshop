import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceNumber, items, location = 'chodov' } = body

    if (!invoiceNumber || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceNumber, items' },
        { status: 400 }
      )
    }

    const results: {
      processed: any[]
      errors: string[]
      totalProcessed: number
    } = {
      processed: [],
      errors: [],
      totalProcessed: 0
    }

    // Process each item in the invoice
    for (const item of items) {
      try {
        const { sku, quantity } = item

        if (!sku || !quantity) {
          results.errors.push(`Missing SKU or quantity for item: ${JSON.stringify(item)}`)
          continue
        }

        // Get current inventory
        const { data: currentInventory, error: fetchError } = await supabase
          .from('inventory')
          .select('*')
          .eq('sku', sku)
          .single()

        if (fetchError) {
          // If inventory record doesn't exist, create one
          if (fetchError.code === 'PGRST116') {
            const { error: createError } = await supabase
              .from('inventory')
              .insert({
                sku,
                chodov_stock: location === 'chodov' ? quantity : 0,
                outlet_stock: location === 'outlet' ? quantity : 0,
                total_stock: quantity,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (createError) {
              results.errors.push(`Failed to create inventory for ${sku}: ${createError.message}`)
              continue
            }
          } else {
            results.errors.push(`Failed to fetch inventory for ${sku}: ${fetchError.message}`)
            continue
          }
        } else {
          // Update existing inventory
          const locationField = `${location}_stock`
          const newLocationStock = (currentInventory[locationField] || 0) + quantity
          const newTotalStock = location === 'chodov' 
            ? newLocationStock + (currentInventory.outlet_stock || 0)
            : (currentInventory.chodov_stock || 0) + newLocationStock

          const { error: updateError } = await supabase
            .from('inventory')
            .update({
              [locationField]: newLocationStock,
              total_stock: newTotalStock,
              updated_at: new Date().toISOString()
            })
            .eq('sku', sku)

          if (updateError) {
            results.errors.push(`Failed to update inventory for ${sku}: ${updateError.message}`)
            continue
          }
        }

        // Create stock movement record
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            sku,
            movement_type: 'in',
            quantity,
            location,
            reason: `Příjem zboží - ${invoiceNumber}`,
            user_id: 'system', // Could be actual user ID from auth
            created_at: new Date().toISOString()
          })

        if (movementError) {
          console.error('Error creating movement record:', movementError)
          // Continue processing even if movement record fails
        }

        results.processed.push({
          sku,
          quantity,
          location,
          status: 'success'
        })
        results.totalProcessed += quantity

      } catch (itemError) {
        console.error(`Error processing item ${item.sku}:`, itemError)
        results.errors.push(`Error processing ${item.sku}: ${itemError instanceof Error ? itemError.message : String(itemError)}`)
      }
    }

    // Update invoice processing status
    const { error: updateInvoiceError } = await supabase
      .from('invoice_processing')
      .update({
        status: results.errors.length > 0 ? 'partially_processed' : 'completed',
        processed_at: new Date().toISOString(),
        processing_results: results
      })
      .eq('invoice_number', invoiceNumber)

    if (updateInvoiceError) {
      console.error('Error updating invoice status:', updateInvoiceError)
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed.length} items successfully`,
      results,
      invoiceNumber
    })

  } catch (error) {
    console.error('Error confirming invoice:', error)
    return NextResponse.json(
      { error: 'Failed to confirm invoice' },
      { status: 500 }
    )
  }
}