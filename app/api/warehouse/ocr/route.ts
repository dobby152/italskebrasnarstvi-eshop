import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// For now, we'll simulate OCR processing
// In production, you would integrate with Tesseract.js or a cloud OCR service
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, JPG, or PNG files.' },
        { status: 400 }
      )
    }

    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In a real implementation, you would:
    // 1. Process the file with Tesseract.js or cloud OCR
    // 2. Parse the invoice data using regex patterns
    // 3. Match SKUs against your product database
    // 4. Extract quantities, prices, dates, etc.

    // Get some real SKUs from database for more realistic simulation
    const { data: realProducts, error } = await supabase
      .from('products')
      .select('sku, name, name_cz, price')
      .limit(10)

    if (error) {
      console.error('Error fetching products for OCR simulation:', error)
    }

    const availableSkus = realProducts?.filter(p => p.sku) || []
    
    // Generate realistic mock OCR results using real data
    const mockResults = {
      invoiceNumber: `FAK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      supplier: 'PIQUADRO Italia S.r.l.',
      date: new Date().toISOString().split('T')[0],
      items: availableSkus.slice(0, Math.floor(Math.random() * 5) + 1).map(product => ({
        sku: product.sku,
        description: product.name_cz || product.name || 'Piquadro produkt',
        quantity: Math.floor(Math.random() * 10) + 1,
        unitPrice: product.price || Math.floor(Math.random() * 5000) + 1000,
        totalPrice: 0 // Will be calculated below
      })),
      confidence: 0.88 + Math.random() * 0.1, // 88-98%
      processingTime: 2.3 + Math.random() * 1.5,
      rawText: "FATTURA N. FAK-2024-123\nPIQUADRO Italia S.r.l.\n...", // Mock raw OCR text
      fileName: file.name,
      fileSize: file.size,
      timestamp: new Date().toISOString()
    }

    // Calculate total prices and invoice total
    let invoiceTotal = 0
    mockResults.items = mockResults.items.map(item => {
      item.totalPrice = item.quantity * item.unitPrice
      invoiceTotal += item.totalPrice
      return item
    })

    // Store OCR result in database for tracking
    const { error: storeError } = await supabase
      .from('invoice_processing')
      .insert({
        invoice_number: mockResults.invoiceNumber,
        supplier: mockResults.supplier,
        file_name: mockResults.fileName,
        file_size: mockResults.fileSize,
        ocr_confidence: mockResults.confidence,
        processing_time: mockResults.processingTime,
        status: 'pending_approval',
        items_count: mockResults.items.length,
        total_amount: invoiceTotal,
        raw_data: mockResults,
        created_at: new Date().toISOString()
      })

    if (storeError) {
      console.error('Error storing OCR result:', storeError)
    }

    return NextResponse.json({
      success: true,
      ...mockResults,
      total: invoiceTotal
    })

  } catch (error) {
    console.error('Error processing OCR:', error)
    return NextResponse.json(
      { error: 'Failed to process OCR' },
      { status: 500 }
    )
  }
}