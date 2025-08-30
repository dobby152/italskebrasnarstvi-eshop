"use client"

import { useState } from 'react'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useOrders } from '../hooks/use-orders'



const getStatusIcon = (status: string) => {
  switch (status) {
    case 'fulfilled':
      return <CheckCircle className="h-4 w-4" />
    case 'unfulfilled':
      return <Clock className="h-4 w-4" />
    case 'partially_fulfilled':
      return <Truck className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'fulfilled':
      return 'Vyřízeno'
    case 'pending':
      return 'Nevyřízeno'
    case 'partially_fulfilled':
      return 'Částečně vyřízeno'
    default:
      return status
  }
}

const getPaymentLabel = (payment: string) => {
  switch (payment) {
    case 'paid':
      return 'Zaplaceno'
    case 'pending':
      return 'Čeká na platbu'
    default:
      return payment
  }
}

const getStatusBadge = (status: string, label: string) => {
  const variants = {
    fulfilled: "bg-green-100 text-green-800",
    unfulfilled: "bg-red-100 text-red-800",
    partially_fulfilled: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
  }

  return <Badge className={`${variants[status as keyof typeof variants]} border-0`}>{label}</Badge>
}

const getPaymentBadge = (payment: string, label: string) => {
  const variants = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  }

  return <Badge className={`${variants[payment as keyof typeof variants]} border-0`}>{label}</Badge>
}

export function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const router = useRouter()
  
  const { orders, stats, loading, error } = useOrders()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Načítání objednávek...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Chyba při načítání objednávek: {error}</div>
      </div>
    )
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || order.payment === paymentFilter
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Objednávky</h1>
          <p className="text-muted-foreground">Spravujte a sledujte všechny objednávky ve vašem obchodě</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Vytvořit objednávku</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                <div className="text-sm text-muted-foreground">Celkem objednávek</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats?.fulfilled || 0}</div>
                <div className="text-sm text-muted-foreground">Vyřízené</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats?.unfulfilled || 0}</div>
                <div className="text-sm text-muted-foreground">Nevyřízené</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats?.partiallyFulfilled || 0}</div>
                <div className="text-sm text-muted-foreground">Částečně vyřízené</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Hledat objednávky..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny</SelectItem>
                <SelectItem value="fulfilled">Vyřízené</SelectItem>
                <SelectItem value="pending">Nevyřízené</SelectItem>
                <SelectItem value="partially_fulfilled">Částečně vyřízené</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Platba" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny</SelectItem>
                <SelectItem value="paid">Zaplacené</SelectItem>
                <SelectItem value="pending">Čekající</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Objednávky</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objednávka</TableHead>
                <TableHead>Zákazník</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead>Platba</TableHead>
                <TableHead>Celkem</TableHead>
                <TableHead className="text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {filteredOrders.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                     {orders.length === 0 ? 'Žádné objednávky' : 'Žádné objednávky odpovídající filtrům'}
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredOrders.map((order) => (
                 <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => router.push(`/admin/objednavky/${order.id}`)}
                    >
                      {order.id}
                    </button>
                  </TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('cs-CZ')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status, getStatusLabel(order.status))}
                    </div>
                  </TableCell>
                  <TableCell>{getPaymentBadge(order.payment, getPaymentLabel(order.payment))}</TableCell>
                  <TableCell className="font-medium">{order.total}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/objednavky/${order.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Zobrazit detail
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Truck className="mr-2 h-4 w-4" />
                          Vyřídit objednávku
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                 </TableRow>
               ))
               )}
             </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
