"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { 
  Phone, Mail, User, Package, Clock, CheckCircle, 
  AlertCircle, XCircle, Bell, Calendar, MessageSquare,
  RefreshCw, Eye, Edit, Trash2, Filter
} from 'lucide-react'

interface SupplierOrder {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  product_sku: string
  product_name: string
  color_variant: string
  quantity: number
  message: string | null
  status: 'pending' | 'contacted_supplier' | 'ordered' | 'received' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  supplier_contact_info: any
  supplier_notes: string | null
  admin_notes: string | null
  estimated_delivery: string | null
  created_at: string
  updated_at: string
  contacted_at: string | null
  completed_at: string | null
}

interface OrderStatistics {
  total_orders: number
  pending_orders: number
  contacted_orders: number
  completed_orders: number
  orders_today: number
  orders_this_week: number
}

export default function SupplierOrdersAdminPage() {
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/supplier-orders?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders)
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      contacted_supplier: 'bg-blue-100 text-blue-800 border-blue-200',
      ordered: 'bg-purple-100 text-purple-800 border-purple-200',
      received: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Čeká na vyřízení',
      contacted_supplier: 'Dodavatel kontaktován',
      ordered: 'Objednáno',
      received: 'Přijato',
      completed: 'Dokončeno',
      cancelled: 'Zrušeno'
    }
    return texts[status as keyof typeof texts] || status
  }

  const getPriorityText = (priority: string) => {
    const texts = {
      low: 'Nízká',
      normal: 'Normální',
      high: 'Vysoká',
      urgent: 'Urgentní'
    }
    return texts[priority as keyof typeof texts] || priority
  }

  const updateOrderStatus = async (orderId: number, newStatus: string, additionalData: any = {}) => {
    try {
      const response = await fetch(`/api/supplier-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...additionalData })
      })

      if (response.ok) {
        fetchOrders() // Refresh data
        setIsEditDialogOpen(false)
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Objednávky dodavatelů</h1>
            <p className="text-gray-600 mt-1">Správa objednávek nedostupných produktů</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Obnovit
          </Button>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Celkem</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Čeká</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.pending_orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Bell className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Kontaktováno</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.contacted_orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Dokončeno</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.completed_orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Dnes</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.orders_today}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tento týden</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.orders_this_week}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Všechny statusy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny statusy</SelectItem>
                    <SelectItem value="pending">Čeká na vyřízení</SelectItem>
                    <SelectItem value="contacted_supplier">Dodavatel kontaktován</SelectItem>
                    <SelectItem value="ordered">Objednáno</SelectItem>
                    <SelectItem value="received">Přijato</SelectItem>
                    <SelectItem value="completed">Dokončeno</SelectItem>
                    <SelectItem value="cancelled">Zrušeno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label htmlFor="priority-filter">Priorita</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Všechny priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny priority</SelectItem>
                    <SelectItem value="urgent">Urgentní</SelectItem>
                    <SelectItem value="high">Vysoká</SelectItem>
                    <SelectItem value="normal">Normální</SelectItem>
                    <SelectItem value="low">Nízká</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Seznam objednávek ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Objednávka #{order.id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('cs-CZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getPriorityColor(order.priority)}`}>
                        {getPriorityText(order.priority)}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Zákazník</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{order.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a href={`mailto:${order.customer_email}`} className="text-blue-600 hover:underline">
                            {order.customer_email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">
                            {order.customer_phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Produkt</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span>{order.product_name}</span>
                        </div>
                        <div className="text-gray-600">
                          SKU: {order.product_sku}
                          {order.color_variant && ` • ${order.color_variant}`}
                          {order.quantity > 1 && ` • ${order.quantity}ks`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.message && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Poznámka zákazníka:</p>
                          <p className="text-sm text-gray-700 mt-1">{order.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <Dialog open={isEditDialogOpen && selectedOrder?.id === order.id} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Spravovat
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Správa objednávky #{order.id}</DialogTitle>
                        </DialogHeader>
                        <OrderManagementForm 
                          order={order}
                          onUpdate={(status, data) => updateOrderStatus(order.id, status, data)}
                          onClose={() => {
                            setIsEditDialogOpen(false)
                            setSelectedOrder(null)
                          }}
                        />
                      </DialogContent>
                    </Dialog>

                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'contacted_supplier')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Označit jako kontaktované
                      </Button>
                    )}

                    {(order.status === 'contacted_supplier' || order.status === 'ordered') && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Dokončit objednávku
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Žádné objednávky nenalezeny</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Order management form component
function OrderManagementForm({ 
  order, 
  onUpdate, 
  onClose 
}: { 
  order: SupplierOrder
  onUpdate: (status: string, data: any) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    status: order.status,
    priority: order.priority,
    admin_notes: order.admin_notes || '',
    supplier_notes: order.supplier_notes || '',
    estimated_delivery: order.estimated_delivery || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData.status, formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as typeof formData.status }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Čeká na vyřízení</SelectItem>
            <SelectItem value="contacted_supplier">Dodavatel kontaktován</SelectItem>
            <SelectItem value="ordered">Objednáno</SelectItem>
            <SelectItem value="received">Přijato</SelectItem>
            <SelectItem value="completed">Dokončeno</SelectItem>
            <SelectItem value="cancelled">Zrušeno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Priorita</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as typeof formData.priority }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Nízká</SelectItem>
            <SelectItem value="normal">Normální</SelectItem>
            <SelectItem value="high">Vysoká</SelectItem>
            <SelectItem value="urgent">Urgentní</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Poznámky admina</Label>
        <Textarea
          value={formData.admin_notes}
          onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
          placeholder="Interní poznámky..."
          rows={3}
        />
      </div>

      <div>
        <Label>Poznámky o dodavateli</Label>
        <Textarea
          value={formData.supplier_notes}
          onChange={(e) => setFormData(prev => ({ ...prev, supplier_notes: e.target.value }))}
          placeholder="Komunikace s dodavatelem..."
          rows={3}
        />
      </div>

      <div>
        <Label>Očekávaný termín dodání</Label>
        <Input
          type="date"
          value={formData.estimated_delivery}
          onChange={(e) => setFormData(prev => ({ ...prev, estimated_delivery: e.target.value }))}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">Uložit změny</Button>
        <Button type="button" variant="outline" onClick={onClose}>Zrušit</Button>
      </div>
    </form>
  )
}