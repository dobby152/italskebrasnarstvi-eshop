import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const { data: discount, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      )
    }

    // Transform discount data
    const transformedDiscount = {
      id: discount.id.toString(),
      title: discount.title,
      description: discount.description || '',
      code: discount.code,
      type: discount.type,
      value: formatDiscountValue(discount.type, discount.value),
      usage: discount.usage_count || 0,
      limit: discount.usage_limit,
      status: determineStatus(discount),
      statusLabel: getStatusLabel(determineStatus(discount)),
      startDate: discount.start_date ? new Date(discount.start_date).toLocaleDateString('cs-CZ') : '',
      endDate: discount.end_date ? new Date(discount.end_date).toLocaleDateString('cs-CZ') : '',
      createdAt: discount.created_at,
      updatedAt: discount.updated_at,
      minimumOrderAmount: discount.minimum_order_amount
    }

    return NextResponse.json(transformedDiscount)

  } catch (error) {
    console.error('Get discount error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discount' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    
    const { data: discount, error } = await supabase
      .from('discounts')
      .update({
        title: data.title,
        description: data.description,
        code: data.code.toUpperCase(),
        type: data.type,
        value_type: data.type === 'percentage' ? 'percentage' : 'fixed_amount',
        value: data.value,
        usage_limit: data.usage_limit,
        minimum_order_amount: data.minimum_order_amount,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(discount)

  } catch (error) {
    console.error('Update discount error:', error)
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ message: 'Discount deleted successfully' })

  } catch (error) {
    console.error('Delete discount error:', error)
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    )
  }
}

function determineStatus(discount: any): 'active' | 'expired' | 'scheduled' {
  const now = new Date()
  const startDate = discount.start_date ? new Date(discount.start_date) : null
  const endDate = discount.end_date ? new Date(discount.end_date) : null

  if (discount.status === 'disabled') {
    return 'expired'
  }

  if (startDate && startDate > now) {
    return 'scheduled'
  }

  if (endDate && endDate < now) {
    return 'expired'
  }

  return 'active'
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Aktivní'
    case 'expired':
      return 'Vypršela'
    case 'scheduled':
      return 'Naplánována'
    default:
      return status
  }
}

function formatDiscountValue(type: string, value: number): string {
  switch (type) {
    case 'percentage':
      return `${value}%`
    case 'fixed':
      return `${value} Kč`
    case 'shipping':
      return 'Doprava zdarma'
    default:
      return value.toString()
  }
}