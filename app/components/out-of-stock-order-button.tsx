"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { AlertCircle, Bell } from 'lucide-react'
import OutOfStockOrderForm from './out-of-stock-order-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"

interface OutOfStockOrderButtonProps {
  productSku: string
  productName: string
  colorVariant?: string
  colorName?: string
  price?: number
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

export default function OutOfStockOrderButton({
  productSku,
  productName,
  colorVariant,
  colorName,
  price,
  size = 'default',
  variant = 'outline',
  className
}: OutOfStockOrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = () => {
    setTimeout(() => setIsOpen(false), 2000)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 ${className}`}
      >
        <Bell className="w-4 h-4" />
        Informovat o dostupnosti
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Produkt není skladem
            </DialogTitle>
          </DialogHeader>
          
          <OutOfStockOrderForm
            productSku={productSku}
            productName={productName}
            colorVariant={colorVariant}
            colorName={colorName}
            price={price}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}