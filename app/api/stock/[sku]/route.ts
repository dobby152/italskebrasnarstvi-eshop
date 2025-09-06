import { NextRequest, NextResponse } from 'next/server'
import { stockService } from '../../../lib/stock-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku: rawSku } = await params
    const sku = decodeURIComponent(rawSku)
    
    // Use the unified stock service
    const stock = await stockService.getProductStock(sku)
    
    return NextResponse.json({
      sku: stock.sku,
      locations: stock.locations,
      totalStock: stock.totalStock,
      available: stock.available,
      lastUpdated: stock.lastUpdated
    })
  } catch (error) {
    console.error('Error fetching stock:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}