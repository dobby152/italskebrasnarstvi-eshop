import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface StockItem {
  productId: string
  stock: number
  row: number
  location: string
}

interface InventoryData {
  inventory: {
    [location: string]: StockItem[]
  }
  parsedAt?: string
}

let inventoryCache: InventoryData | null = null
let cacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getInventoryData(): InventoryData | null {
  const now = Date.now()
  
  if (inventoryCache && (now - cacheTime) < CACHE_DURATION) {
    return inventoryCache
  }
  
  try {
    const inventoryPath = path.join(process.cwd(), 'inventory-parsed.json')
    const inventoryContent = fs.readFileSync(inventoryPath, 'utf-8')
    inventoryCache = JSON.parse(inventoryContent)
    cacheTime = now
    return inventoryCache
  } catch (error) {
    console.error('Error loading inventory data:', error)
    return null
  }
}

function findProductStock(sku: string, inventoryData: InventoryData) {
  const results: { location: string; stock: number }[] = []
  
  for (const [location, items] of Object.entries(inventoryData.inventory)) {
    for (const item of items) {
      // Match by exact SKU or if SKU is contained in productId
      if (item.productId === sku || 
          item.productId.includes(sku) || 
          sku.includes(item.productId)) {
        results.push({
          location: location,
          stock: item.stock
        })
        break // Only one match per location
      }
    }
  }
  
  return results
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sku } = await params
    
    if (!sku) {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 })
    }
    
    const inventoryData = getInventoryData()
    
    if (!inventoryData) {
      return NextResponse.json({ 
        sku,
        locations: [],
        totalStock: 0,
        available: false,
        error: 'Inventory data not available'
      })
    }
    
    const stockLocations = findProductStock(sku, inventoryData)
    const totalStock = stockLocations.reduce((sum, location) => sum + location.stock, 0)
    
    return NextResponse.json({
      sku,
      locations: stockLocations,
      totalStock,
      available: totalStock > 0,
      lastUpdated: (inventoryData as any).parsedAt || null
    })
    
  } catch (error) {
    console.error('Stock API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}