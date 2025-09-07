import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const { data: order, error } = await supabase
      .from('supplier_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching supplier order:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      order,
      success: true
    })
  } catch (error) {
    console.error('Supplier order GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      status,
      priority,
      supplier_contact_info,
      supplier_notes,
      admin_notes,
      estimated_delivery
    } = body

    // Build update object
    const updateData: any = {}
    
    if (status) {
      const validStatuses = ['pending', 'contacted_supplier', 'ordered', 'received', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status
      
      // Set timestamps based on status
      if (status === 'contacted_supplier' && !body.contacted_at) {
        updateData.contacted_at = new Date().toISOString()
      }
      if (status === 'completed' && !body.completed_at) {
        updateData.completed_at = new Date().toISOString()
      }
    }

    if (priority) {
      const validPriorities = ['low', 'normal', 'high', 'urgent']
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority' },
          { status: 400 }
        )
      }
      updateData.priority = priority
    }

    if (supplier_contact_info !== undefined) updateData.supplier_contact_info = supplier_contact_info
    if (supplier_notes !== undefined) updateData.supplier_notes = supplier_notes
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes
    if (estimated_delivery !== undefined) updateData.estimated_delivery = estimated_delivery

    const { data: order, error } = await supabase
      .from('supplier_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      console.error('Error updating supplier order:', error)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    console.log('✅ Supplier order updated:', {
      id: orderId,
      status: order.status,
      priority: order.priority
    })

    return NextResponse.json({
      order,
      success: true,
      message: 'Order updated successfully'
    })
  } catch (error) {
    console.error('Supplier order PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('supplier_orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      console.error('Error deleting supplier order:', error)
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      )
    }

    console.log('✅ Supplier order deleted:', { id: orderId })

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Supplier order DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}