"use client"

import { useState, useEffect } from "react"
import { Button } from "../../app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card"
import { Badge } from "../../app/components/ui/badge"
import { Separator } from "../../app/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../app/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select"
import { Input } from "../../app/components/ui/input"
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye, 
  Download, 
  RotateCcw,
  Search,
  Filter,
  Loader2
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface OrderItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
    brand: string
    image_url: string
  }
  variant?: {
    id: string
    title: string
    option1_value?: string
    option2_value?: string
  }
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  total_amount: number
  items_count: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  shipping_method: string
  tracking_number?: string
  items: OrderItem[]
  created_at: string
  updated_at: string
  estimated_delivery?: string
  shipping_address: {
    street: string
    city: string
    postal_code: string
    country: string
  }
}

const statusMap = {
  pending: { label: 'Čekající', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Potvrzená', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  processing: { label: 'Zpracovává se', color: 'bg-purple-100 text-purple-800', icon: Package },
  shipped: { label: 'Odeslána', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Doručena', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Zrušena', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Refundována', color: 'bg-gray-100 text-gray-800', icon: RotateCcw }
}

const paymentStatusMap = {
  pending: { label: 'Čekající platba', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Zaplaceno', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Platba selhala', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refundováno', color: 'bg-gray-100 text-gray-800' }
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    loadOrders()
  }, [selectedStatus])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadOrders()
  }

  const downloadInvoice = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `faktura-${orderId}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download invoice:', error)
    }
  }

  const trackOrder = (trackingNumber: string) => {
    // Open tracking page in new window
    window.open(`https://www.posta.cz/trackandtrace/-/zasilka/cislo?parcelNumbers=${trackingNumber}`, '_blank')
  }

  const filteredOrders = orders.filter(order => {
    if (searchQuery) {
      return order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
             order.items.some(item => 
               item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               item.product.sku.toLowerCase().includes(searchQuery.toLowerCase())
             )
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Historie objednávek
        </h1>
        <p className="text-gray-600">
          Přehled všech vašich objednávek a jejich stavu
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                placeholder="Hledat podle čísla objednávky nebo produktu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrovat podle stavu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny objednávky</SelectItem>
              <SelectItem value="pending">Čekající</SelectItem>
              <SelectItem value="confirmed">Potvrzené</SelectItem>
              <SelectItem value="processing">Zpracovávají se</SelectItem>
              <SelectItem value="shipped">Odeslané</SelectItem>
              <SelectItem value="delivered">Doručené</SelectItem>
              <SelectItem value="cancelled">Zrušené</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrovat
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Žádné objednávky nenalezeny
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedStatus !== 'all' 
              ? 'Zkuste změnit kritéria vyhledávání'
              : 'Zatím jste neudělali žádnou objednávku'
            }
          </p>
          {!searchQuery && selectedStatus === 'all' && (
            <Link href="/produkty">
              <Button>
                Začít nakupovat
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = statusMap[order.status]
            const paymentInfo = paymentStatusMap[order.payment_status]
            const StatusIcon = statusInfo.icon

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          Objednávka #{order.order_number}
                        </h3>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <Badge className={paymentInfo.color}>
                          {paymentInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Objednáno: {new Date(order.created_at).toLocaleDateString('cs-CZ')}</p>
                        {order.estimated_delivery && (
                          <p>Očekávané doručení: {new Date(order.estimated_delivery).toLocaleDateString('cs-CZ')}</p>
                        )}
                        {order.tracking_number && (
                          <p>Sledovací číslo: 
                            <button
                              onClick={() => trackOrder(order.tracking_number!)}
                              className="ml-1 text-blue-600 hover:text-blue-800 underline"
                            >
                              {order.tracking_number}
                            </button>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {order.total_amount.toLocaleString('cs-CZ')} Kč
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.items_count} položek
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mb-4">
                    <div className="flex -space-x-2 mb-3">
                      {order.items.slice(0, 4).map((item, index) => (
                        <div
                          key={item.id}
                          className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border-2 border-white"
                          style={{ zIndex: 10 - index }}
                        >
                          <Image
                            src={item.product.image_url || '/placeholder.svg'}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center">
                          <span className="text-xs text-gray-600">+{order.items.length - 4}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {order.items.slice(0, 2).map((item, index) => (
                        <span key={item.id}>
                          {item.product.name}
                          {item.quantity > 1 && ` (${item.quantity}×)`}
                          {index < Math.min(order.items.length, 2) - 1 && ', '}
                        </span>
                      ))}
                      {order.items.length > 2 && (
                        <span> a {order.items.length - 2} dalších</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Detail
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[600px] sm:max-w-[600px]">
                        <SheetHeader>
                          <SheetTitle>Detail objednávky #{order.order_number}</SheetTitle>
                        </SheetHeader>
                        
                        {selectedOrder && (
                          <div className="space-y-6 mt-6">
                            {/* Order Status */}
                            <div>
                              <h4 className="font-medium mb-3">Stav objednávky</h4>
                              <div className="flex gap-2">
                                <Badge className={statusMap[selectedOrder.status].color}>
                                  {statusMap[selectedOrder.status].label}
                                </Badge>
                                <Badge className={paymentStatusMap[selectedOrder.payment_status].color}>
                                  {paymentStatusMap[selectedOrder.payment_status].label}
                                </Badge>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div>
                              <h4 className="font-medium mb-3">Položky objednávky</h4>
                              <div className="space-y-3">
                                {selectedOrder.items.map((item) => (
                                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                      <Image
                                        src={item.product.image_url || '/placeholder.svg'}
                                        alt={item.product.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-medium">{item.product.name}</h5>
                                      <p className="text-sm text-gray-600">
                                        {item.product.brand} • {item.product.sku}
                                      </p>
                                      {item.variant && (
                                        <p className="text-sm text-gray-600">
                                          {item.variant.option1_value} {item.variant.option2_value}
                                        </p>
                                      )}
                                      <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm">Množství: {item.quantity}</span>
                                        <span className="font-medium">
                                          {item.total_price.toLocaleString('cs-CZ')} Kč
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                              <h4 className="font-medium mb-3">Doručovací adresa</h4>
                              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                <p>{selectedOrder.shipping_address.street}</p>
                                <p>{selectedOrder.shipping_address.postal_code} {selectedOrder.shipping_address.city}</p>
                                <p>{selectedOrder.shipping_address.country}</p>
                              </div>
                            </div>

                            {/* Order Total */}
                            <div>
                              <Separator className="mb-3" />
                              <div className="flex justify-between items-center text-lg font-bold">
                                <span>Celková částka</span>
                                <span>{selectedOrder.total_amount.toLocaleString('cs-CZ')} Kč</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </SheetContent>
                    </Sheet>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadInvoice(order.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Faktura
                    </Button>

                    {order.tracking_number && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => trackOrder(order.tracking_number!)}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Sledovat
                      </Button>
                    )}

                    {order.status === 'delivered' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/produkty?reorder=${order.id}`}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Objednat znovu
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}