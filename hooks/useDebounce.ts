import { useState, useEffect } from 'react'

/**
 * Custom hook that returns a debounced version of the input value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timer if the value changes before the delay is complete
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for debounced filters with loading state
 * @param initialFilters - Initial filter values
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns Object with current filters, debounced filters, loading state, and update function
 */
export function useDebouncedFilters<T>(initialFilters: T, delay: number = 500) {
  const [filters, setFilters] = useState<T>(initialFilters)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const debouncedFilters = useDebounce(filters, delay)

  useEffect(() => {
    // Set loading state when filters change
    if (JSON.stringify(filters) !== JSON.stringify(debouncedFilters)) {
      setIsDebouncing(true)
    } else {
      setIsDebouncing(false)
    }
  }, [filters, debouncedFilters])

  const updateFilters = (newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const resetFilters = () => {
    setFilters(initialFilters)
  }

  return {
    filters,
    debouncedFilters,
    isDebouncing,
    updateFilters,
    resetFilters,
    setFilters
  }
}