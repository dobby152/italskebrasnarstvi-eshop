"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Filter,
  Download,
  Plus,
  Calendar,
  User,
  Package
} from "lucide-react"
import { useStockMovements } from '../../../hooks/useWarehouse'

const MovementsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  
  const { movements, loading } = useStockMovements()

  const getMovementIcon = (type: string) => {
    return type === 'in' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    )
  }

  const getMovementColor = (type: string) => {
    return type === 'in' 
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pohyby zásob</h2>
          <p className="text-gray-600">Historie všech pohybů skladových zásob</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nový pohyb
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Hledat podle SKU nebo důvodu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Typ pohybu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny pohyby</SelectItem>
                  <SelectItem value="in">Pouze příjmy</SelectItem>
                  <SelectItem value="out">Pouze výdeje</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Lokace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny lokace</SelectItem>
                  <SelectItem value="chodov">Chodov</SelectItem>
                  <SelectItem value="outlet">Outlet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Pohyby zásob
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">Typ</TableHead>
                  <TableHead>Produkt</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Množství</TableHead>
                  <TableHead>Lokace</TableHead>
                  <TableHead>Důvod</TableHead>
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
                        Načítání pohybů...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Žádné pohyby zásob</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getMovementIcon(movement.movement_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-900">{movement.product_name}</p>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {movement.sku}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className={getMovementColor(movement.movement_type)}
                        >
                          {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity} ks
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            movement.location === 'chodov' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <span className="text-sm capitalize">{movement.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {movement.reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">{movement.user_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(movement.created_at)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MovementsPage