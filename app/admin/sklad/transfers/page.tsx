"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { 
  ArrowRightLeft, 
  Send, 
  Clock, 
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  Package,
  MapPin,
  User,
  Calendar
} from "lucide-react"
import { useTransfers } from '../../../hooks/useTransfers'

const TransfersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [directionFilter, setDirectionFilter] = useState<string>('all')
  
  const { transfers, loading } = useTransfers()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Send className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getDirectionInfo = (fromLocation: string, toLocation: string) => {
    const direction = fromLocation === 'chodov' ? 'outlet' : 'chodov'
    const arrow = fromLocation === 'chodov' ? '→' : '←'
    const color = fromLocation === 'chodov' ? 'text-green-600' : 'text-blue-600'
    
    return {
      direction,
      arrow,
      color,
      text: `${fromLocation} ${arrow} ${toLocation}`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Dokončeno'
      case 'pending': return 'Čeká'
      case 'rejected': return 'Zamítnuto'
      default: return 'Odesláno'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Převody mezi pobočkami</h2>
          <p className="text-gray-600">Správa a sledování převodů zboží mezi pobočkami</p>
        </div>
        <div className="flex gap-3">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nový převod
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktivní převody</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {transfers.filter(t => t.status === 'pending').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Čekají na zpracování</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dokončené dnes</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {transfers.filter(t => 
                    t.status === 'completed' && 
                    new Date(t.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Úspěšně převedeno</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chodov → Outlet</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {transfers.filter(t => t.from_location === 'chodov').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Celkem převodů</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <ArrowRightLeft className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outlet → Chodov</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {transfers.filter(t => t.from_location === 'outlet').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Celkem převodů</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <ArrowRightLeft className="h-8 w-8 text-purple-600 rotate-180" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Hledat podle SKU nebo poznámky..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Stav" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny stavy</SelectItem>
                  <SelectItem value="pending">Čeká</SelectItem>
                  <SelectItem value="completed">Dokončeno</SelectItem>
                  <SelectItem value="rejected">Zamítnuto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Směr" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny směry</SelectItem>
                  <SelectItem value="to_outlet">Do Outlet</SelectItem>
                  <SelectItem value="to_chodov">Do Chodov</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Historie převodů
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">Stav</TableHead>
                  <TableHead>Produkt</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Množství</TableHead>
                  <TableHead>Převod</TableHead>
                  <TableHead>Poznámka</TableHead>
                  <TableHead>Uživatel</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        Načítání převodů...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Žádné převody mezi pobočkami</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((transfer, index) => {
                    const directionInfo = getDirectionInfo(transfer.from_location, transfer.to_location)
                    
                    return (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getStatusIcon(transfer.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-gray-900">{transfer.product_name}</p>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {transfer.sku}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {transfer.quantity} ks
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className={`text-sm font-medium ${directionInfo.color}`}>
                              {directionInfo.text}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {transfer.notes || '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{transfer.user_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatDate(transfer.created_at)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TransfersPage