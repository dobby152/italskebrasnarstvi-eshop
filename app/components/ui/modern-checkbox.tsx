"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cn } from "../../lib/utils"

interface ModernCheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string
  description?: string
  variant?: 'default' | 'modern' | 'gradient'
}

const ModernCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  ModernCheckboxProps
>(({ className, label, description, variant = 'modern', ...props }, ref) => {
  return (
    <div className="flex items-start space-x-3 group">
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          // Base styles
          "peer shrink-0 rounded border-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          
          // Size and transitions
          "w-5 h-5 transition-all duration-300 ease-out",
          
          // Variant styles
          variant === 'default' && [
            "border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
            "hover:border-primary/50 hover:shadow-sm"
          ],
          
          variant === 'modern' && [
            "border-gray-300 bg-white shadow-sm",
            "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 data-[state=checked]:shadow-lg data-[state=checked]:shadow-blue-500/25",
            "hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10 hover:scale-105",
            "focus-visible:ring-blue-500/20 focus-visible:border-blue-400",
            "active:scale-95"
          ],
          
          variant === 'gradient' && [
            "border-gray-300 bg-white shadow-sm",
            "data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600",
            "data-[state=checked]:border-transparent data-[state=checked]:shadow-lg data-[state=checked]:shadow-purple-500/25",
            "hover:border-purple-300 hover:shadow-md hover:shadow-purple-500/10 hover:scale-105",
            "focus-visible:ring-purple-500/20 focus-visible:border-purple-400",
            "active:scale-95"
          ],
          
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <svg
            className="w-3.5 h-3.5 animate-in zoom-in-50 duration-200"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      
      {(label || description) && (
        <div className="grid gap-1 leading-none cursor-pointer" onClick={() => {
          // Toggle checkbox when clicking label area
          const event = new MouseEvent('click', { bubbles: true })
          ref && typeof ref !== 'function' && ref.current?.dispatchEvent(event)
        }}>
          {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-hover:text-primary transition-colors cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground cursor-pointer">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
})

ModernCheckbox.displayName = "ModernCheckbox"

export { ModernCheckbox }