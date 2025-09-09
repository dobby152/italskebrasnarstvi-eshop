"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Search, X, Star, TrendingUp, Package, Tag } from 'lucide-react'

interface AutocompleteResult {
  type: 'product' | 'category' | 'brand' | 'suggestion'
  value: string
  label: string
  count?: number
  image?: string
  price?: number
}

interface AdvancedSearchProps {
  onSearch?: (query: string, filters?: any) => void
  placeholder?: string
  className?: string
}

export function AdvancedSearch({ onSearch, placeholder = "Hledat produkty...", className }: AdvancedSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const results = await response.json()
        setSuggestions(results)
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
    }
    setIsLoading(false)
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)
    setIsOpen(true)

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)
  }

  const handleSelectSuggestion = (suggestion: AutocompleteResult) => {
    setQuery(suggestion.label)
    setIsOpen(false)
    
    // Save to recent searches
    const updated = [suggestion.label, ...recentSearches.filter(s => s !== suggestion.label)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))

    // Track analytics
    trackSearchAnalytics(suggestion.label, suggestion)
    
    // Trigger search
    if (onSearch) {
      onSearch(suggestion.label)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      
      // Save to recent searches
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches', JSON.stringify(updated))

      // Track analytics
      trackSearchAnalytics(query)
      
      // Trigger search
      if (onSearch) {
        onSearch(query)
      }
    }
  }

  const trackSearchAnalytics = async (searchQuery: string, selectedResult?: AutocompleteResult) => {
    try {
      await fetch('/api/search/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          selectedResult: selectedResult ? {
            type: selectedResult.type,
            value: selectedResult.value
          } : null,
          userId: null // Add user ID if available
        })
      })
    } catch (error) {
      console.error('Analytics tracking failed:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    const totalSuggestions = suggestions.length + (recentSearches.length > 0 ? recentSearches.length : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < totalSuggestions - 1 ? prev + 1 : -1
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > -1 ? prev - 1 : totalSuggestions - 1
        )
        break
      
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < recentSearches.length) {
            // Recent search selected
            setQuery(recentSearches[selectedIndex])
            setIsOpen(false)
            if (onSearch) onSearch(recentSearches[selectedIndex])
          } else {
            // Suggestion selected
            const suggestionIndex = selectedIndex - recentSearches.length
            handleSelectSuggestion(suggestions[suggestionIndex])
          }
        } else {
          handleSubmit(e)
        }
        break
      
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'product': return <Package className="h-4 w-4 text-blue-500" />
      case 'brand': return <Star className="h-4 w-4 text-purple-500" />
      case 'category': return <Tag className="h-4 w-4 text-green-500" />
      case 'suggestion': return <TrendingUp className="h-4 w-4 text-orange-500" />
      default: return <Search className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10 border-gray-300 focus:border-black focus:ring-black"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSuggestions([])
                inputRef.current?.focus()
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 bg-white shadow-xl border-gray-200 z-50 max-h-96 overflow-auto">
          {isLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {!isLoading && (
            <div className="py-2">
              {/* Recent Searches */}
              {query.length === 0 && recentSearches.length > 0 && (
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                    <TrendingUp className="h-3 w-3" />
                    Nedávná hledání
                  </div>
                  {recentSearches.map((search, index) => (
                    <div
                      key={search}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md ${
                        selectedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setQuery(search)
                        setIsOpen(false)
                        if (onSearch) onSearch(search)
                      }}
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{search}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.map((suggestion, index) => {
                const adjustedIndex = index + recentSearches.length
                return (
                  <div
                    key={`${suggestion.type}-${suggestion.value}`}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                      selectedIndex === adjustedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {getIconForType(suggestion.type)}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{suggestion.label}</span>
                        {suggestion.type !== 'product' && (
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.type === 'brand' ? 'Značka' : 
                             suggestion.type === 'category' ? 'Kategorie' : 
                             'Návrh'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {suggestion.price && (
                      <div className="text-sm font-medium text-gray-900">
                        {suggestion.price.toLocaleString('cs-CZ')} Kč
                      </div>
                    )}
                  </div>
                )
              })}

              {!isLoading && suggestions.length === 0 && query.length >= 2 && (
                <div className="px-3 py-4 text-center text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Žádné návrhy pro &quot;{query}&quot;</p>
                  <p className="text-sm">Zkuste jiné klíčové slovo</p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}