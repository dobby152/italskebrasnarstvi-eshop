"use client"

import { VariantAttributeOption } from "../lib/types/variants"

interface ColorSelectorProps {
  colors: VariantAttributeOption[]
  selectedColor?: string
  onColorChange: (color: string) => void
  className?: string
}

export default function ColorSelector({
  colors,
  selectedColor,
  onColorChange,
  className = ""
}: ColorSelectorProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {colors.map((color) => {
        const isSelected = selectedColor === color.value
        const isAvailable = color.available
        
        return (
          <button
            key={color.value}
            onClick={() => isAvailable && onColorChange(color.value)}
            disabled={!isAvailable}
            className={`
              relative w-8 h-8 rounded-full border-2 flex items-center justify-center
              ${isSelected ? 'border-black ring-2 ring-offset-2 ring-black' : 'border-gray-300'}
              ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 transition-transform'}
            `}
            style={{ backgroundColor: color.hexColor || '#ffffff' }}
            title={`${color.displayValue}${!isAvailable ? ' (Nedostupné)' : ''}`}
          >
            {!isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 rotate-45"></div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}