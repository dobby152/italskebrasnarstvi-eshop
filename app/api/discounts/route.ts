import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export interface Discount {
  id: string
  title: string
  description: string
  code: string
  type: 'percentage' | 'fixed' | 'shipping'
  value: string
  usage: number
  limit: number | null
  status: 'active' | 'expired' | 'scheduled'
  statusLabel: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export interface DiscountStats {
  total: number
  active: number
  scheduled: number
  totalUsage: number
}

export async function GET(request: NextRequest) {
  try {
    // Fetch discounts from database
    const { data: discounts, error } = await supabase
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Transform discounts data
    const transformedDiscounts = discounts?.map((discount: any) => ({
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
      updatedAt: discount.updated_at
    })) || []

    // Calculate stats
    const now = new Date()
    const stats = {
      total: transformedDiscounts.length,
      active: transformedDiscounts.filter(d => d.status === 'active').length,
      scheduled: transformedDiscounts.filter(d => d.status === 'scheduled').length,
      totalUsage: transformedDiscounts.reduce((sum, d) => sum + d.usage, 0)
    }

    return NextResponse.json({
      discounts: transformedDiscounts,
      stats
    })

  } catch (error) {
    console.error('Discounts API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const { data: discount, error } = await supabase
      .from('discounts')
      .insert({
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
        status: data.status || 'active'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(discount)

  } catch (error) {
    console.error('Create discount error:', error)
    return NextResponse.json(
      { error: 'Failed to create discount' },
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