import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const SALT_ROUNDS = 12

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone, acceptsMarketing } = await request.json()

    // Validate required fields
    if (!email || !password || !firstName) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'Email, password, and first name are required'
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    
    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')

    // Create user
    const { data: newUser, error } = await supabase
      .from('customers')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        accepts_marketing: acceptsMarketing || false,
        email_verification_token: emailVerificationToken,
        email_verified: false,
        state: 'enabled'
      })
      .select()
      .single()

    if (error) {
      console.error('User creation error:', error)
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      )
    }

    // Create default wishlist
    await supabase
      .from('wishlists')
      .insert({
        customer_id: newUser.id,
        name: 'Má wishlist',
        is_default: true
      })

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex')
    await supabase
      .from('user_sessions')
      .insert({
        customer_id: newUser.id,
        session_token: sessionToken,
        device_info: request.headers.get('user-agent') ? { userAgent: request.headers.get('user-agent') } : {},
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })

    return NextResponse.json({
      message: 'User registered successfully',
      accessToken: token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        phone: newUser.phone,
        role: 'customer',
        emailVerified: newUser.email_verified
      },
      sessionToken
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}