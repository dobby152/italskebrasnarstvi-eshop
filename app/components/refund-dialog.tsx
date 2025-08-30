'use client'

import { useState } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { RefreshCw, AlertCircle, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"

interface OrderItem {
  id: number
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  total_price: number
  refunded_quantity: number
}

interface RefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  onRefundCreated: () => void
}

interface RefundItem {
  order_item_id: number
  quantity: number
  subtotal: number
}

export function RefundDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  items,
  totalAmount,
  onRefundCreated
}: RefundDialogProps) {
  const [refundItems, setRefundItems] = useState<RefundItem[]>(
    items.map(item => ({
      order_item_id: item.id,
      quantity: 0,
      subtotal: 0
    }))
  )
  
  const [reason, setReason] = useState('requested_by_customer')
  const [note, setNote] = useState('')
  const [gateway, setGateway] = useState('manual')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateItemQuantity = (itemId: number, quantity: number) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const subtotal = quantity * item.unit_price
    
    setRefundItems(prev =>
      prev.map(refundItem =>
        refundItem.order_item_id === itemId 
          ? { ...refundItem, quantity, subtotal }
          : refundItem
      )
    )
  }

  const totalRefundAmount = refundItems.reduce((sum, item) => sum + item.subtotal, 0)
  const canRefund = refundItems.some(item => item.quantity > 0) && totalRefundAmount > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canRefund) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalRefundAmount,
          reason,
          note: note || null,
          gateway,
          notify_customer: notifyCustomer,
          line_items: refundItems.filter(item => item.quantity > 0)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create refund')
      }

      onRefundCreated()
      onOpenChange(false)
      
      // Reset form
      setRefundItems(
        items.map(item => ({
          order_item_id: item.id,
          quantity: 0,
          subtotal: 0
        }))
      )
      setReason('requested_by_customer')
      setNote('')
      setGateway('manual')
      setNotifyCustomer(true)
      
    } catch (err) {
      console.error('Error creating refund:', err)
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
            <RefreshCw className="h-5 w-5" />
            Vytvořit vrácení peněz
          </DialogTitle>
          <DialogDescription>
            Objednávka {orderNumber} - Vyberte položky k vrácení
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Items to Refund */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Položky k vrácení</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const maxRefundable = item.quantity - item.refunded_quantity
                const currentQuantity = refundItems.find(ri => ri.order_item_id === item.id)?.quantity || 0
                const currentSubtotal = refundItems.find(ri => ri.order_item_id === item.id)?.subtotal || 0
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {item.product_sku}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.refunded_quantity}/{item.quantity} vráceno • {maxRefundable} k dispozici
                      </div>
                      <div className="text-sm font-medium text-green-600 mt-1">
                        {item.unit_price.toLocaleString('cs-CZ')} Kč za kus
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <Label htmlFor={`quantity-${item.id}`} className="sr-only">
                          Množství pro vrácení {item.product_name}
                        </Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="0"
                          max={maxRefundable}
                          value={currentQuantity}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                          disabled={maxRefundable === 0}
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                          / {maxRefundable}
                        </div>
                        {currentSubtotal > 0 && (
                          <div className="text-sm font-medium text-green-600 mt-1">
                            {currentSubtotal.toLocaleString('cs-CZ')} Kč
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Total Refund Amount */}
              {totalRefundAmount > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Celková částka k vrácení:</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">
                      {totalRefundAmount.toLocaleString('cs-CZ')} Kč
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Refund Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informace o vrácení</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Důvod vrácení</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requested_by_customer">Požádal zákazník</SelectItem>
                      <SelectItem value="duplicate">Duplicitní objednávka</SelectItem>
                      <SelectItem value="fraudulent">Podvodná objednávka</SelectItem>
                      <SelectItem value="defective">Vadný produkt</SelectItem>
                      <SelectItem value="other">Jiný důvod</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gateway">Způsob vrácení</Label>
                  <Select value={gateway} onValueChange={setGateway}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manuální vrácení</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bank_transfer">Bankovní převod</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Poznámka k vrácení</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Volitelná poznámka o důvodu vrácení..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyCustomer"
                  checked={notifyCustomer}
                  onCheckedChange={(checked) => setNotifyCustomer(checked as boolean)}
                />
                <Label htmlFor="notifyCustomer" className="text-sm">
                  Informovat zákazníka o vrácení peněz emailem
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
              disabled={!canRefund || isSubmitting}
              className="min-w-[140px]"
              variant="destructive"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Zpracovávám...
                </div>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Vrátit {totalRefundAmount.toLocaleString('cs-CZ')} Kč
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}