import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Get user with password hash
    const { data: user, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return NextResponse.json(
        { error: 'Account temporarily locked' },
        { status: 423 }
      )
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)
    
    if (!passwordValid) {
      // Increment login attempts
      const loginAttempts = (user.login_attempts || 0) + 1
      const lockUntil = loginAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null // 30 min lock

      await supabase
        .from('customers')
        .update({ 
          login_attempts: loginAttempts,
          locked_until: lockUntil
        })
        .eq('id', user.id)

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Reset login attempts and update last login
    await supabase
      .from('customers')
      .update({
        login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString()
      })
      .eq('id', user.id)

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '7d' }
    )

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex')
    await supabase
      .from('user_sessions')
      .insert({
        customer_id: user.id,
        session_token: sessionToken,
        device_info: request.headers.get('user-agent') ? { userAgent: request.headers.get('user-agent') } : {},
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        expires_at: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000)
      })

    return NextResponse.json({
      message: 'Login successful',
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role || 'customer',
        address: user.address
      },
      sessionToken
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}