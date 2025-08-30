'use client'

import { useState } from 'react'
import { Product } from '@/lib/api'
import { ProductEditForm } from './product-edit-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatPrice, getProductDisplayName } from '@/lib/api'

interface ProductEditDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductUpdated: (updatedProduct: Product) => void
}

export function ProductEditDialog({
  product,
  open,
  onOpenChange,
  onProductUpdated
}: ProductEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async (updatedProduct: Product) => {
    setIsLoading(true)
    try {
      // Aktualizace produktu v nadřazené komponentě
      onProductUpdated(updatedProduct)
      // Zavření dialogu
      onOpenChange(false)
    } catch (error) {
      console.error('Chyba při ukládání produktu:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!product) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold truncate">
                Upravit produkt
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {getProductDisplayName(product)}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
              <Badge variant="outline" className="text-xs">
                SKU: {product.sku}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {formatPrice(product.price)}
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6 py-4">
            <div className="pb-4">
              <ProductEditForm
                product={product}
                onSave={handleSave}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}