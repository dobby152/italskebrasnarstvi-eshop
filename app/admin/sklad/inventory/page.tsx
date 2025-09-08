"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  Package,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useInventory } from '../../../hooks/useWarehouse'

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { products, loading, pagination, goToPage } = useInventory(
    currentPage, 
    25,
    searchTerm,
    locationFilter,
    stockFilter,
    sortBy,
    sortOrder
  )

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🔴'
      case 'high': return '🟠'
      default: return '🟡'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Správa inventáře</h2>
          <p className="text-gray-600">Procházení a správa všech skladových zásob</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtry a vyhledávání
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Hledat podle SKU nebo názvu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Lokace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny lokace</SelectItem>
                  <SelectItem value="chodov">Pouze Chodov</SelectItem>
                  <SelectItem value="outlet">Pouze Outlet</SelectItem>
                  <SelectItem value="both">Obě pobočky</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Stav zásob" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny produkty</SelectItem>
                  <SelectItem value="low">Nízké zásoby</SelectItem>
                  <SelectItem value="critical">Kritické zásoby</SelectItem>
                  <SelectItem value="out">Vyprodané</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Řadit podle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Název</SelectItem>
                  <SelectItem value="sku">SKU</SelectItem>
                  <SelectItem value="stock">Stav zásob</SelectItem>
                  <SelectItem value="priority">Priorita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventář produktů
              {pagination && (
                <Badge variant="outline" className="ml-2">
                  {pagination.totalCount.toLocaleString()} produktů
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Načítání inventáře...</span>
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">
                        <AlertTriangle className="h-4 w-4" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        Produkt
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('sku')}
                      >
                        SKU
                      </TableHead>
                      <TableHead className="text-center">Chodov</TableHead>
                      <TableHead className="text-center">Outlet</TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('stock')}
                      >
                        Celkem
                      </TableHead>
                      <TableHead>Lokace</TableHead>
                      <TableHead className="text-center">Priorita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => (
                      <TableRow 
                        key={index} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>
                          <div className="text-lg">
                            {getPriorityIcon(product.priority)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              Min. zásoba: {product.minStock} ks
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {product.sku}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {product.chodovStock} ks
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {product.outletStock} ks
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={product.currentStock === 0 ? "destructive" : "default"}
                            className={product.currentStock === 0 ? "" : "bg-gray-100 text-gray-800"}
                          >
                            {product.currentStock} ks
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {product.location}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={`${getPriorityColor(product.priority)} border-0`}
                          >
                            {product.priority === 'critical' ? 'Kritická' : 
                             product.priority === 'high' ? 'Vysoká' : 'Střední'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Zobrazeno {((pagination.currentPage - 1) * 25) + 1} - {Math.min(pagination.currentPage * 25, pagination.totalCount)} z {pagination.totalCount.toLocaleString()} produktů
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPreviousPage}
                      onClick={() => {
                        const newPage = pagination.currentPage - 1
                        setCurrentPage(newPage)
                        goToPage(newPage)
                      }}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Předchozí
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setCurrentPage(pageNum)
                              goToPage(pageNum)
                            }}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => {
                        const newPage = pagination.currentPage + 1
                        setCurrentPage(newPage)
                        goToPage(newPage)
                      }}
                    >
                      Další
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default InventoryPage