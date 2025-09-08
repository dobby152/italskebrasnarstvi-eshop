"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { AlertCircle, CheckCircle, Phone, Mail, User, MessageSquare, Package } from 'lucide-react'

interface OutOfStockOrderFormProps {
  productSku: string
  productName: string
  colorVariant?: string
  colorName?: string
  price?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export default function OutOfStockOrderForm({
  productSku,
  productName,
  colorVariant,
  colorName,
  price,
  onSuccess,
  onCancel
}: OutOfStockOrderFormProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    quantity: 1,
    message: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/supplier-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          product_sku: productSku,
          product_name: productName,
          color_variant: colorVariant || colorName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit order')
      }

      setSuccess(true)
      console.log('✅ Order submitted successfully:', data.order)
      
      // Reset form
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        quantity: 1,
        message: ''
      })

      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000)
      }
    } catch (err) {
      console.error('Error submitting order:', err)
      setError(err instanceof Error ? err.message : 'Došlo k chybě při odesílání objednávky')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">Objednávka odeslána!</h3>
          <p className="text-green-700 mb-4">
            Děkujeme za objednávku. Zboží vám dodáme do 14 dnů a brzy vás budeme kontaktovat.
          </p>
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              <strong>Produkt:</strong> {productName}
              {colorName && <span> ({colorName})</span>}
            </p>
            <p className="text-sm text-gray-600">
              <strong>SKU:</strong> {productSku}
            </p>
          </div>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" className="bg-white">
              Zavřít
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-200">
            <AlertCircle className="w-4 h-4 mr-1" />
            Objednávka na vyžádání
          </Badge>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mt-2">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">{productName}</span>
          </div>
          {colorName && (
            <p className="text-sm text-gray-600">Barva: {colorName}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">SKU: {productSku}</p>
          {price && (
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {price.toLocaleString('cs-CZ')} Kč
            </p>
          )}
        </div>
      </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customer_name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Jméno a příjmení *
            </Label>
            <Input
              id="customer_name"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleInputChange}
              required
              placeholder="Jan Novák"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-mail *
            </Label>
            <Input
              id="customer_email"
              name="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={handleInputChange}
              required
              placeholder="jan@email.cz"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefon *
            </Label>
            <Input
              id="customer_phone"
              name="customer_phone"
              type="tel"
              value={formData.customer_phone}
              onChange={handleInputChange}
              required
              placeholder="+420 123 456 789"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Množství</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              max="10"
              value={formData.quantity}
              onChange={handleInputChange}
              disabled={loading}
              className="w-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Poznámka (volitelné)
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Např. termín potřeby, speciální požadavky..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Důležité:</strong> Objednávka je závazná. Po odeslání formuláře vás budeme kontaktovat 
              s informacemi o platbě a dodání do 14 dnů.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Odesílám...' : 'Odeslat objednávku'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Zrušit
              </Button>
            )}
          </div>
        </form>
    </div>
  )
}