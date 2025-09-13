'use client'

import { useState, useEffect } from 'react'

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

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [stats, setStats] = useState<DiscountStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/discounts')
        if (!response.ok) {
          throw new Error('Failed to fetch discounts')
        }
        
        const data = await response.json()
        setDiscounts(data.discounts || [])
        setStats(data.stats || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching discounts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDiscounts()
  }, [])

  return {
    discounts,
    stats,
    loading,
    error,
    refetch: () => {
      setLoading(true)
      setError(null)
      // Re-trigger the effect
      window.location.reload()
    }
  }
}

export function useDiscount(id: string) {
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/discounts/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch discount')
        }
        
        const data = await response.json()
        setDiscount(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching discount:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDiscount()
    }
  }, [id])

  return {
    discount,
    loading,
    error
  }
}