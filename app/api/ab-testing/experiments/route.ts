import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { sanitizeString, getSecurityHeaders } from '@/app/lib/security'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface ABExperiment {
  id?: string
  name: string
  description: string
  hypothesis: string
  variants: ABVariant[]
  targetAudience: {
    percentage: number
    conditions?: {
      device?: 'mobile' | 'desktop' | 'all'
      location?: string
      newUsers?: boolean
      source?: string
    }
  }
  metrics: {
    primary: string
    secondary?: string[]
  }
  startDate: string
  endDate?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  createdBy: string
}

interface ABVariant {
  id: string
  name: string
  description: string
  trafficAllocation: number // percentage
  changes: {
    component?: string
    element?: string
    property?: string
    value: any
    selector?: string
  }[]
}

// Create new A/B test experiment
export async function POST(request: NextRequest) {
  try {
    const experiment: ABExperiment = await request.json()
    
    // Validate experiment data
    if (!experiment.name || !experiment.variants || experiment.variants.length < 2) {
      return NextResponse.json(
        { error: 'Invalid experiment data' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Validate traffic allocation adds up to 100%
    const totalAllocation = experiment.variants.reduce((sum, v) => sum + v.trafficAllocation, 0)
    if (Math.abs(totalAllocation - 100) > 0.1) {
      return NextResponse.json(
        { error: 'Traffic allocation must sum to 100%' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Save experiment
    const { data: savedExperiment, error } = await supabase
      .from('ab_experiments')
      .insert({
        name: sanitizeString(experiment.name),
        description: sanitizeString(experiment.description),
        hypothesis: sanitizeString(experiment.hypothesis),
        variants: experiment.variants,
        target_audience: experiment.targetAudience,
        metrics: experiment.metrics,
        start_date: experiment.startDate,
        end_date: experiment.endDate || null,
        status: experiment.status,
        created_by: sanitizeString(experiment.createdBy),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating experiment:', error)
      return NextResponse.json(
        { error: 'Failed to create experiment' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Initialize experiment analytics
    await supabase
      .from('ab_experiment_analytics')
      .insert({
        experiment_id: savedExperiment.id,
        total_visitors: 0,
        total_conversions: 0,
        variant_data: experiment.variants.map(v => ({
          variantId: v.id,
          visitors: 0,
          conversions: 0,
          conversionRate: 0
        })),
        created_at: new Date().toISOString()
      })

    const response = NextResponse.json({
      experiment: savedExperiment,
      message: 'Experiment created successfully'
    })

    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error) {
    console.error('A/B testing API error:', error)
    return NextResponse.json(
      { error: 'Failed to process experiment' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

// Get all experiments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const active = searchParams.get('active') === 'true'

    let query = supabase
      .from('ab_experiments')
      .select(`
        *,
        ab_experiment_analytics(*)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (active) {
      const now = new Date().toISOString()
      query = query
        .eq('status', 'active')
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
    }

    const { data: experiments, error } = await query

    if (error) {
      console.error('Error fetching experiments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch experiments' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    const response = NextResponse.json({ experiments })
    
    response.headers.set('Cache-Control', 'public, s-maxage=60')
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error) {
    console.error('Get experiments error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve experiments' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

// Update experiment
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Experiment ID required' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    const { data: experiment, error } = await supabase
      .from('ab_experiments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating experiment:', error)
      return NextResponse.json(
        { error: 'Failed to update experiment' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    return NextResponse.json(
      { experiment, message: 'Experiment updated successfully' },
      { headers: getSecurityHeaders() }
    )

  } catch (error) {
    console.error('Update experiment error:', error)
    return NextResponse.json(
      { error: 'Failed to update experiment' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

// Delete experiment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Experiment ID required' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Check if experiment is active
    const { data: experiment } = await supabase
      .from('ab_experiments')
      .select('status')
      .eq('id', id)
      .single()

    if (experiment?.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active experiment. Please pause it first.' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Delete experiment and related analytics
    await supabase.from('ab_experiment_analytics').delete().eq('experiment_id', id)
    await supabase.from('ab_experiment_events').delete().eq('experiment_id', id)
    
    const { error } = await supabase
      .from('ab_experiments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting experiment:', error)
      return NextResponse.json(
        { error: 'Failed to delete experiment' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    return NextResponse.json(
      { message: 'Experiment deleted successfully' },
      { headers: getSecurityHeaders() }
    )

  } catch (error) {
    console.error('Delete experiment error:', error)
    return NextResponse.json(
      { error: 'Failed to delete experiment' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}