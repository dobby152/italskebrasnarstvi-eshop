import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// Create stock_movements table if it doesn't exist
async function ensureStockMovementsTable() {
  const { error } = await supabase.rpc('create_stock_movements_table', {})
  if (error && !error.message.includes('already exists')) {
    console.error('Error creating stock_movements table:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureStockMovementsTable()

    // Get recent stock movements
    const { data: movements, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        products!inner(
          name,
          name_cz
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Stock movements error:', error)
      // If table doesn't exist, return mock data
      return NextResponse.json([
        {
          id: 1,
          sku: 'BD3336W92-AZBE2',
          product_name: 'Pánská aktovka Blue Square',
          movement_type: 'in',
          quantity: 5,
          location: 'chodov',
          reason: 'Příjem zboží - FAK-2024-001',
          created_at: new Date().toISOString(),
          user_id: 'system'
        },
        {
          id: 2,
          sku: 'CA4818AP-GR',
          product_name: 'Dámská kabelka Circle',
          movement_type: 'out',
          quantity: 2,
          location: 'outlet',
          reason: 'Prodej - objednávka #1234',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          user_id: 'system'
        }
      ])
    }

    const formattedMovements = movements?.map(movement => ({
      ...movement,
      product_name: movement.products?.name_cz || movement.products?.name || 'Neznámý produkt'
    })) || []

    return NextResponse.json(formattedMovements)

  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureStockMovementsTable()
    
    const body = await request.json()
    const { sku, movement_type, quantity, location, reason, user_id = 'system' } = body

    if (!sku || !movement_type || !quantity || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: sku, movement_type, quantity, location' },
        { status: 400 }
      )
    }

    // Insert movement record
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        sku,
        movement_type,
        quantity,
        location,
        reason: reason || 'Manual adjustment',
        user_id
      })
      .select()
      .single()

    if (movementError) {
      console.error('Error creating stock movement:', movementError)
      throw movementError
    }

    // Update inventory based on movement
    const { data: currentInventory, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', sku)
      .single()

    if (fetchError) {
      console.error('Error fetching current inventory:', fetchError)
      throw fetchError
    }

    const stockChange = movement_type === 'in' ? quantity : -quantity
    const locationField = `${location}_stock`
    
    const updatedStock = Math.max(0, (currentInventory[locationField] || 0) + stockChange)
    const totalStock = location === 'chodov' 
      ? updatedStock + (currentInventory.outlet_stock || 0)
      : (currentInventory.chodov_stock || 0) + updatedStock

    const { error: updateError } = await supabase
      .from('inventory')
      .update({
        [locationField]: updatedStock,
        total_stock: totalStock,
        updated_at: new Date().toISOString()
      })
      .eq('sku', sku)

    if (updateError) {
      console.error('Error updating inventory:', updateError)
      throw updateError
    }

    return NextResponse.json({ 
      success: true, 
      movement,
      message: `Stock ${movement_type === 'in' ? 'increased' : 'decreased'} by ${quantity} for ${sku}`
    })

  } catch (error) {
    console.error('Error creating stock movement:', error)
    return NextResponse.json(
      { error: 'Failed to create stock movement' },
      { status: 500 }
    )
  }
}