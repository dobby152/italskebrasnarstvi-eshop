"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  role: 'customer' | 'admin'
  address?: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  isAuthenticated: boolean
  isAdmin: boolean
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  address?: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-domain.com/api' 
  : 'http://localhost:3001/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus()
  }, [])

  async function checkAuthStatus() {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser({
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          phone: userData.phone,
          role: userData.role,
          address: userData.address
        })
      } else {
        // Token is invalid, try to refresh
        await refreshToken()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('accessToken')
    } finally {
      setLoading(false)
    }
  }

  async function refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const { accessToken } = await response.json()
        localStorage.setItem('accessToken', accessToken)
        await checkAuthStatus()
        return true
      } else {
        localStorage.removeItem('accessToken')
        setUser(null)
        return false
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      localStorage.removeItem('accessToken')
      setUser(null)
      return false
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken)
        setUser({
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          phone: data.user.phone,
          role: data.user.role,
          address: data.user.address
        })
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Přihlášení se nezdařilo' }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Přihlášení se nezdařilo' }
    }
  }

  async function register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        localStorage.setItem('accessToken', result.accessToken)
        setUser({
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          phone: result.user.phone,
          role: result.user.role,
          address: result.user.address
        })
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Registrace se nezdařila' }
      }
    } catch (error) {
      console.error('Registration failed:', error)
      return { success: false, error: 'Registrace se nezdařila' }
    }
  }

  async function logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      setUser(null)
    }
  }

  async function updateProfile(data: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        return { success: false, error: 'Nejste přihlášeni' }
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          address: data.address
        })
      })

      const result = await response.json()

      if (response.ok) {
        setUser(prev => prev ? {
          ...prev,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          phone: result.user.phone,
          address: result.user.address
        } : null)
        return { success: true }
      } else {
        if (response.status === 401) {
          // Token expired, try refresh
          const refreshed = await refreshToken()
          if (refreshed) {
            return updateProfile(data) // Retry with new token
          }
        }
        return { success: false, error: result.error || 'Aktualizace profilu se nezdařila' }
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      return { success: false, error: 'Aktualizace profilu se nezdařila' }
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}