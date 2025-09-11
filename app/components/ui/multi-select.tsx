"use client"

import * as React from "react"
import { ChevronDown, X, Search } from "lucide-react"
import { cn } from "../../lib/utils"
import { Badge } from "./badge"

export interface Option {
  label: string
  value: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  maxDisplay?: number
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Vyberte možnosti...",
  searchPlaceholder = "Hledat...",
  disabled = false,
  className,
  maxDisplay = 2
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchValue("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const handleRemove = (value: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onChange(selected.filter(item => item !== value))
  }

  const handleClearAll = (event: React.MouseEvent) => {
    event.stopPropagation()
    onChange([])
  }

  const getDisplayText = () => {
    if (selected.length === 0) {
      return placeholder
    }

    const selectedOptions = options.filter(option => selected.includes(option.value))
    
    if (selected.length <= maxDisplay) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map(option => (
            <Badge
              key={option.value}
              variant="secondary"
              className="text-xs py-0.5 px-2 hover:bg-gray-200 transition-colors"
            >
              {option.label}
              <X
                className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500 transition-colors"
                onClick={(e) => handleRemove(option.value, e)}
              />
            </Badge>
          ))}
        </div>
      )
    }

    return `${selected.length} vybráno`
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          isOpen && "ring-2 ring-ring ring-offset-2",
          className
        )}
      >
        <div className="flex-1 text-left min-h-[20px] flex items-center">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            getDisplayText()
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <X
              className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              onClick={handleClearAll}
            />
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground shadow-lg rounded-md border animate-in fade-in-0 zoom-in-95">
          {/* Search Input */}
          {options.length > 5 && (
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-sm bg-background border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Žádné možnosti nenalezeny
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleToggle(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-4 h-4 border rounded flex items-center justify-center transition-all duration-200",
                        isSelected 
                          ? "bg-primary border-primary text-primary-foreground scale-100" 
                          : "border-muted-foreground scale-90"
                      )}>
                        {isSelected && (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1">{option.label}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer with selection count */}
          {selected.length > 0 && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/50">
              {selected.length} z {options.length} vybráno
            </div>
          )}
        </div>
      )}
    </div>
  )
}