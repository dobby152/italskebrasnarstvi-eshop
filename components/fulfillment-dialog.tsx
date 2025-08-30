'use client'

import { useState } from 'react'
import { Button } from "../app/components/ui/button"
import { Input } from "../app/components/ui/input"
import { Label } from "../app/components/ui/label"
import { Textarea } from "../app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../app/components/ui/select"
import { Checkbox } from "../app/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card"
import { Badge } from "../app/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../app/components/ui/dialog"
import { Package, Truck, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "../app/components/ui/alert"

interface OrderItem {
  id: number
  product_name: string
  product_sku: string
  quantity: number
  fulfillable_quantity: number
  fulfilled_quantity: number
}

interface FulfillmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderNumber: string
  items: OrderItem[]
  onFulfillmentCreated: () => void
}

interface FulfillmentItem {
  order_item_id: number
  quantity: number
}

export function FulfillmentDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  items,
  onFulfillmentCreated
}: FulfillmentDialogProps) {
  const [fulfillmentItems, setFulfillmentItems] = useState<FulfillmentItem[]>(
    items.map(item => ({
      order_item_id: item.id,
      quantity: Math.max(0, item.fulfillable_quantity - item.fulfilled_quantity)
    }))
  )
  
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingCompany, setTrackingCompany] = useState('')
  const [service, setService] = useState('standard')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateItemQuantity = (itemId: number, quantity: number) => {
    setFulfillmentItems(prev =>
      prev.map(item =>
        item.order_item_id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const canFulfill = fulfillmentItems.some(item => item.quantity > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canFulfill) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}/fulfillments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service,
          tracking_company: trackingCompany || null,
          tracking_number: trackingNumber || null,
          notify_customer: notifyCustomer,
          line_items: fulfillmentItems.filter(item => item.quantity > 0)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create fulfillment')
      }

      onFulfillmentCreated()
      onOpenChange(false)
      
      // Reset form
      setTrackingNumber('')
      setTrackingCompany('')
      setService('standard')
      setNotifyCustomer(true)
      setFulfillmentItems(
        items.map(item => ({
          order_item_id: item.id,
          quantity: Math.max(0, item.fulfillable_quantity - item.fulfilled_quantity)
        }))
      )
      
    } catch (err) {
      console.error('Error creating fulfillment:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Vytvořit expedici
          </DialogTitle>
          <DialogDescription>
            Objednávka {orderNumber} - Vyberte položky k expedici
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Items to Fulfill */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Položky k expedici</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const maxFulfillable = item.fulfillable_quantity - item.fulfilled_quantity
                const currentQuantity = fulfillmentItems.find(fi => fi.order_item_id === item.id)?.quantity || 0
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {item.product_sku}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.fulfilled_quantity}/{item.quantity} expedováno • {maxFulfillable} k dispozici
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`quantity-${item.id}`} className="sr-only">
                        Množství pro {item.product_name}
                      </Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min="0"
                        max={maxFulfillable}
                        value={currentQuantity}
                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-20"
                        disabled={maxFulfillable === 0}
                      />
                      <span className="text-sm text-muted-foreground">
                        / {maxFulfillable}
                      </span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informace o expedici</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Služba expedice</Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standardní doprava</SelectItem>
                      <SelectItem value="express">Expresní doprava</SelectItem>
                      <SelectItem value="overnight">Overnight</SelectItem>
                      <SelectItem value="pickup">Osobní odběr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trackingCompany">Dopravce</Label>
                  <Input
                    id="trackingCompany"
                    value={trackingCompany}
                    onChange={(e) => setTrackingCompany(e.target.value)}
                    placeholder="např. České pošty, DPD..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Sledovací číslo</Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Zadejte sledovací číslo zásilky"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyCustomer"
                  checked={notifyCustomer}
                  onCheckedChange={(checked) => setNotifyCustomer(checked as boolean)}
                />
                <Label htmlFor="notifyCustomer" className="text-sm">
                  Informovat zákazníka o expedici emailem
                </Label>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
            <Button 
              type="submit" 
              disabled={!canFulfill || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Vytvářím...
                </div>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Vytvořit expedici
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}