import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { sanitizeString, getSecurityHeaders } from '@/app/lib/security'
import crypto from 'crypto'

interface AssignmentRequest {
  userId?: string
  sessionId: string
  userAgent?: string
  location?: string
  referrer?: string
  isNewUser?: boolean
}

interface Assignment {
  experimentId: string
  variantId: string
  variantName: string
  changes: any[]
}

// Hash-based deterministic assignment
function assignToVariant(
  experimentId: string, 
  identifier: string, 
  variants: any[]
): string {
  // Create deterministic hash based on experiment + user identifier
  const hash = crypto
    .createHash('md5')
    .update(`${experimentId}:${identifier}`)
    .digest('hex')
  
  // Convert hash to number between 0-100
  const hashValue = parseInt(hash.substring(0, 8), 16)
  const percentage = (hashValue % 10000) / 100 // 0-99.99
  
  // Find variant based on traffic allocation
  let cumulativeAllocation = 0
  for (const variant of variants) {
    cumulativeAllocation += variant.trafficAllocation
    if (percentage < cumulativeAllocation) {
      return variant.id
    }
  }
  
  // Fallback to first variant
  return variants[0]?.id
}

function checkTargetingConditions(
  audience: any,
  userContext: AssignmentRequest
): boolean {
  if (!audience.conditions) return true
  
  const { conditions } = audience
  
  // Device targeting
  if (conditions.device && conditions.device !== 'all') {
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userContext.userAgent || '')
    const userDevice = isMobile ? 'mobile' : 'desktop'
    if (conditions.device !== userDevice) return false
  }
  
  // New user targeting
  if (conditions.newUsers !== undefined) {
    if (conditions.newUsers !== userContext.isNewUser) return false
  }
  
  // Source/referrer targeting
  if (conditions.source && userContext.referrer) {
    if (!userContext.referrer.includes(conditions.source)) return false
  }
  
  return true
}

export async function POST(request: NextRequest) {
  try {
    const userContext: AssignmentRequest = await request.json()
    
    const { userId, sessionId, userAgent, location, referrer, isNewUser } = userContext
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }
    
    const identifier = userId || sessionId
    
    // Get all active experiments
    const now = new Date().toISOString()
    const { data: experiments, error } = await supabase
      .from('ab_experiments')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`)
    
    if (error) {
      console.error('Error fetching experiments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch experiments' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }
    
    const assignments: Assignment[] = []
    
    for (const experiment of experiments || []) {
      // Check if user already has assignment for this experiment
      const { data: existingAssignment } = await supabase
        .from('ab_experiment_assignments')
        .select('variant_id')
        .eq('experiment_id', experiment.id)
        .eq('user_identifier', identifier)
        .single()
      
      let variantId: string
      
      if (existingAssignment) {
        // Use existing assignment
        variantId = existingAssignment.variant_id
      } else {
        // Check targeting conditions
        if (!checkTargetingConditions(experiment.target_audience, userContext)) {
          continue // Skip this experiment
        }
        
        // Random sampling - check if user should be included
        const sampleHash = crypto
          .createHash('md5')
          .update(`sample:${experiment.id}:${identifier}`)
          .digest('hex')
        const sampleValue = (parseInt(sampleHash.substring(0, 8), 16) % 10000) / 100
        
        if (sampleValue >= experiment.target_audience.percentage) {
          continue // User not in experiment sample
        }
        
        // Assign to variant
        variantId = assignToVariant(experiment.id, identifier, experiment.variants)
        
        // Save assignment
        await supabase
          .from('ab_experiment_assignments')
          .insert({
            experiment_id: experiment.id,
            variant_id: variantId,
            user_identifier: identifier,
            user_id: userId || null,
            session_id: sessionId,
            user_agent: userAgent || null,
            location: location || null,
            referrer: referrer || null,
            is_new_user: isNewUser || false,
            assigned_at: new Date().toISOString()
          })
        
        // Update analytics
        await supabase.rpc('increment_experiment_visitors', {
          exp_id: experiment.id,
          var_id: variantId
        })
      }
      
      // Find variant details
      const variant = experiment.variants.find((v: any) => v.id === variantId)
      
      if (variant) {
        assignments.push({
          experimentId: experiment.id,
          variantId: variant.id,
          variantName: variant.name,
          changes: variant.changes || []
        })
      }
    }
    
    const response = NextResponse.json({
      assignments,
      userId: userId || null,
      sessionId
    })
    
    // Cache for 1 hour to avoid repeated assignments
    response.headers.set('Cache-Control', 'private, max-age=3600')
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
    
  } catch (error) {
    console.error('Assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to assign experiments' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

// Track conversion event
export async function PUT(request: NextRequest) {
  try {
    const { 
      experimentId, 
      variantId, 
      userId, 
      sessionId, 
      eventType = 'conversion',
      eventValue,
      metadata 
    } = await request.json()
    
    if (!experimentId || !variantId || (!userId && !sessionId)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }
    
    const identifier = userId || sessionId
    
    // Check if this conversion already exists (prevent duplicates)
    const { data: existing } = await supabase
      .from('ab_experiment_events')
      .select('id')
      .eq('experiment_id', experimentId)
      .eq('variant_id', variantId)
      .eq('user_identifier', identifier)
      .eq('event_type', eventType)
      .single()
    
    if (existing) {
      return NextResponse.json(
        { message: 'Event already tracked' },
        { headers: getSecurityHeaders() }
      )
    }
    
    // Record conversion event
    await supabase
      .from('ab_experiment_events')
      .insert({
        experiment_id: experimentId,
        variant_id: variantId,
        user_identifier: identifier,
        user_id: userId || null,
        session_id: sessionId || null,
        event_type: eventType,
        event_value: eventValue || null,
        metadata: metadata || null,
        created_at: new Date().toISOString()
      })
    
    // Update analytics
    if (eventType === 'conversion') {
      await supabase.rpc('increment_experiment_conversions', {
        exp_id: experimentId,
        var_id: variantId
      })
    }
    
    return NextResponse.json(
      { message: 'Event tracked successfully' },
      { headers: getSecurityHeaders() }
    )
    
  } catch (error) {
    console.error('Conversion tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}