'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card"
import { Button } from "../app/components/ui/button"
import { Badge } from "../app/components/ui/badge"
import { Separator } from "../app/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../app/components/ui/tabs"
import { ScrollArea } from "../app/components/ui/scroll-area"
import { FulfillmentDialog } from "./fulfillment-dialog"
import { 
  ArrowLeft, 
  Package, 
  CreditCard, 
  MapPin, 
  Clock, 
  Truck,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Printer,
  Mail,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react"
import Link from "next/link"

interface OrderDetailProps {
  orderId: string
}

interface OrderEvent {
  id: number
  event_type: string
  event_status: string
  description: string
  created_by: string
  created_at: string
  details?: any
}

interface OrderItem {
  id: number
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  total_price: number
  fulfillable_quantity: number
  fulfilled_quantity: number
  refunded_quantity: number
  product_id?: number
}

interface Fulfillment {
  id: number
  status: string
  tracking_number: string
  tracking_company: string
  shipped_at: string
  delivered_at?: string
  line_items: any[]
}

interface OrderDetail {
  id: number
  order_number: string
  customer_name: string
  customer_email: string
  status: string
  payment_status: string
  fulfillment_status: string
  financial_status: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  created_at: string
  updated_at: string
  shipped_at?: string
  delivered_at?: string
  order_note?: string
  tags: string[]
  
  // Address information
  shipping_address_line1?: string
  shipping_city?: string
  shipping_postal_code?: string
  billing_address_line1?: string
  billing_city?: string
  billing_postal_code?: string
  
  // Related data
  items: OrderItem[]
  events: OrderEvent[]
  fulfillments: Fulfillment[]
  refunds: any[]
  notes: any[]
}

const getStatusColor = (status: string, type: 'order' | 'payment' | 'fulfillment') => {
  const colors = {
    order: {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800', 
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    },
    payment: {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    },
    fulfillment: {
      unfulfilled: 'bg-gray-100 text-gray-800',
      partial: 'bg-yellow-100 text-yellow-800',
      fulfilled: 'bg-green-100 text-green-800'
    }
  }
  return colors[type][status as keyof typeof colors[typeof type]] || 'bg-gray-100 text-gray-800'
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered':
    case 'paid':
    case 'fulfilled':
      return <CheckCircle2 className="h-4 w-4" />
    case 'cancelled':
    case 'failed':
      return <XCircle className="h-4 w-4" />
    case 'pending':
      return <Clock className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

export function OrderDetailPage({ orderId }: OrderDetailProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFulfillmentDialog, setShowFulfillmentDialog] = useState(false)

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch order details')
      }
      const data = await response.json()
      setOrder(data)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail()
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Chyba při načítání objednávky: {error}</p>
        <Link href="/admin/objednavky">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět na objednávky
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/objednavky">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Objednávky
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Objednávka {order.order_number}</h1>
            <p className="text-muted-foreground">
              Vytvořeno {new Date(order.created_at).toLocaleDateString('cs-CZ')} • {order.customer_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Tisknout
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Email zákazník
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status objednávky</p>
                <div className="flex items-center mt-1">
                  {getStatusIcon(order.status)}
                  <Badge className={`ml-2 ${getStatusColor(order.status, 'order')}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platba</p>
                <div className="flex items-center mt-1">
                  {getStatusIcon(order.payment_status)}
                  <Badge className={`ml-2 ${getStatusColor(order.payment_status, 'payment')}`}>
                    {order.payment_status === 'paid' ? 'Zaplaceno' : 'Čeká na platbu'}
                  </Badge>
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expedice</p>
                <div className="flex items-center mt-1">
                  {getStatusIcon(order.fulfillment_status)}
                  <Badge className={`ml-2 ${getStatusColor(order.fulfillment_status, 'fulfillment')}`}>
                    {order.fulfillment_status === 'fulfilled' ? 'Expedováno' :
                     order.fulfillment_status === 'partial' ? 'Částečně' : 'Neexpedováno'}
                  </Badge>
                </div>
              </div>
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          <Tabs defaultValue="items" className="space-y-4">
            <TabsList>
              <TabsTrigger value="items">Položky ({order.items.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline ({order.events.length})</TabsTrigger>
              <TabsTrigger value="fulfillment">Expedice</TabsTrigger>
            </TabsList>

            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <CardTitle>Objednané položky</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Produkt
                          </th>
                          <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            SKU
                          </th>
                          <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Množství
                          </th>
                          <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Cena
                          </th>
                          <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Celkem
                          </th>
                          <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Expedice
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {order.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium">{item.product_name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {item.product_sku}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {item.unit_price.toLocaleString('cs-CZ')} Kč
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              {item.total_price.toLocaleString('cs-CZ')} Kč
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="space-y-1">
                                <div>
                                  {item.fulfilled_quantity}/{item.quantity} expedováno
                                </div>
                                {item.refunded_quantity > 0 && (
                                  <div className="text-red-600">
                                    {item.refunded_quantity} vráceno
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Historie objednávky</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {order.events?.map((event, index) => (
                        <div key={event.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              event.event_status === 'success' ? 'bg-green-500' :
                              event.event_status === 'failed' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">
                              <span className="font-medium">{event.description}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(event.created_at).toLocaleString('cs-CZ')} • {event.created_by}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fulfillment">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Správa expedice</CardTitle>
                  <Button size="sm" onClick={() => setShowFulfillmentDialog(true)}>
                    <Package className="h-4 w-4 mr-2" />
                    Vytvořit expedici
                  </Button>
                </CardHeader>
                <CardContent>
                  {order.fulfillments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Žádné expedice nevytvořeny</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {order.fulfillments?.map((fulfillment) => (
                        <div key={fulfillment.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getStatusColor(fulfillment.status, 'fulfillment')}>
                              {fulfillment.status}
                            </Badge>
                            {fulfillment.tracking_number && (
                              <div className="text-sm">
                                <span className="font-medium">Tracking: </span>
                                {fulfillment.tracking_number}
                              </div>
                            )}
                          </div>
                          {fulfillment.shipped_at && (
                            <p className="text-sm text-muted-foreground">
                              Expedováno: {new Date(fulfillment.shipped_at).toLocaleString('cs-CZ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Order Summary & Customer Info */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Souhrn objednávky</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Mezisoučet</span>
                <span>{order.subtotal.toLocaleString('cs-CZ')} Kč</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Sleva</span>
                  <span>-{order.discount_amount.toLocaleString('cs-CZ')} Kč</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Doprava</span>
                <span>{order.shipping_amount.toLocaleString('cs-CZ')} Kč</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>DPH</span>
                <span>{order.tax_amount.toLocaleString('cs-CZ')} Kč</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Celkem</span>
                <span>{order.total_amount.toLocaleString('cs-CZ')} Kč</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informace o zákazníkovi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
              </div>
              
              {order.shipping_address_line1 && (
                <div>
                  <p className="text-sm font-medium mb-1">Doručovací adresa</p>
                  <div className="text-sm text-muted-foreground">
                    <p>{order.shipping_address_line1}</p>
                    <p>{order.shipping_postal_code} {order.shipping_city}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Czech Republic</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.order_note && (
            <Card>
              <CardHeader>
                <CardTitle>Poznámky k objednávce</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.order_note}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {order.tags && order.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Štítky</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {order.tags?.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Fulfillment Dialog */}
      {order && (
        <FulfillmentDialog
          open={showFulfillmentDialog}
          onOpenChange={setShowFulfillmentDialog}
          orderId={orderId}
          orderNumber={order.order_number}
          items={order.items}
          onFulfillmentCreated={fetchOrderDetail}
        />
      )}
    </div>
  )
}