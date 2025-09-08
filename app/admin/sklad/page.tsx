"use client"

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import {
  Warehouse,
  Upload,
  FileText,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Scan,
  Camera,
  FileImage,
  Loader2,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Plus,
  Minus,
  History
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Progress } from '../../components/ui/progress'
import { useWarehouseStats, useLowStockProducts, useStockMovements, useOCRProcessing } from '../../hooks/useWarehouse'

const WarehousePage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<'chodov' | 'outlet'>('chodov')
  const [manualMovement, setManualMovement] = useState({
    sku: '',
    quantity: 1,
    type: 'in' as 'in' | 'out',
    reason: ''
  })

  // Real data hooks
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useWarehouseStats()
  const { products: lowStockProducts, loading: lowStockLoading, refetch: refetchLowStock } = useLowStockProducts()
  const { movements, loading: movementsLoading, createMovement } = useStockMovements()
  const { processing: ocrProcessing, results: ocrResults, processFile, confirmInvoice, clearResults } = useOCRProcessing()

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      clearResults()
    }
  }, [clearResults])

  const processInvoiceOCR = async () => {
    if (!selectedFile) return
    
    try {
      await processFile(selectedFile)
    } catch (error) {
      console.error('OCR processing failed:', error)
      alert('Chyba při zpracování OCR: ' + (error as Error).message)
    }
  }

  const confirmStockUpdate = async () => {
    if (!ocrResults) return

    try {
      const result = await confirmInvoice(ocrResults.invoiceNumber, ocrResults.items, selectedLocation)
      alert(`Úspěšně zpracováno ${result.results.totalProcessed} kusů produktů!`)
      setSelectedFile(null)
      refetchStats()
      refetchLowStock()
    } catch (error) {
      console.error('Failed to confirm invoice:', error)
      alert('Chyba při potvrzení faktury: ' + (error as Error).message)
    }
  }

  const handleManualMovement = async () => {
    if (!manualMovement.sku || !manualMovement.quantity) {
      alert('Prosím vyplňte SKU a množství')
      return
    }

    try {
      await createMovement({
        sku: manualMovement.sku,
        movement_type: manualMovement.type,
        quantity: manualMovement.quantity,
        location: selectedLocation,
        reason: manualMovement.reason || 'Ruční úprava'
      })
      
      setManualMovement({ sku: '', quantity: 1, type: 'in', reason: '' })
      alert('Pohyb skladu byl úspěšně zaznamenán!')
      refetchStats()
      refetchLowStock()
    } catch (error) {
      console.error('Failed to create movement:', error)
      alert('Chyba při vytváření pohybu: ' + (error as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Warehouse className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Inteligentní správa skladu</h1>
              </div>
              <p className="text-gray-600">Pokročilý systém pro správu skladových zásob s OCR zpracováním faktur</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Celkem produktů</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : statsError ? (
                      'N/A'
                    ) : (
                      stats?.totalProducts || 0
                    )}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Hodnota skladu</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statsLoading ? (
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                    ) : statsError ? (
                      'N/A'
                    ) : (
                      `${((stats?.totalValue || 0) / 1000).toFixed(0)}K Kč`
                    )}
                  </p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Upozornění</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {statsLoading ? (
                      <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                    ) : statsError ? (
                      'N/A'
                    ) : (
                      stats?.lowStockAlerts || 0
                    )}
                  </p>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Pohyby (7 dní)</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : statsError ? (
                      'N/A'
                    ) : (
                      stats?.recentMovements || 0
                    )}
                  </p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              {!statsLoading && (
                <div className="mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refetchStats}
                    className="text-xs p-1 h-auto"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Aktualizovat
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* OCR Invoice Processing */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Nastavení skladu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Aktivní lokace:</label>
                  <Select value={selectedLocation} onValueChange={(value: 'chodov' | 'outlet') => setSelectedLocation(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chodov">Chodov</SelectItem>
                      <SelectItem value="outlet">Outlet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Manual Stock Movement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Ruční pohyby skladu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">SKU produktu</label>
                    <Input
                      placeholder="např. BD3336W92-AZBE2"
                      value={manualMovement.sku}
                      onChange={(e) => setManualMovement(prev => ({ ...prev, sku: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Množství</label>
                    <Input
                      type="number"
                      min="1"
                      value={manualMovement.quantity}
                      onChange={(e) => setManualMovement(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Typ pohybu</label>
                    <Select 
                      value={manualMovement.type} 
                      onValueChange={(value: 'in' | 'out') => setManualMovement(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Příjem (IN)</SelectItem>
                        <SelectItem value="out">Výdej (OUT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Důvod</label>
                    <Input
                      placeholder="např. Oprava inventury"
                      value={manualMovement.reason}
                      onChange={(e) => setManualMovement(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleManualMovement}
                  className="w-full"
                  disabled={!manualMovement.sku || !manualMovement.quantity}
                >
                  <div className="flex items-center gap-2">
                    {manualMovement.type === 'in' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    {manualMovement.type === 'in' ? 'Přidat do skladu' : 'Odebrat ze skladu'}
                  </div>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  OCR Zpracování faktur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Nahrajte fakturu</h3>
                      <p className="text-gray-600">Podporované formáty: PDF, JPG, PNG</p>
                    </div>
                    <div className="mt-4">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="invoice-upload"
                      />
                      <label
                        htmlFor="invoice-upload"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Vybrat soubor
                      </label>
                    </div>
                  </div>
                </div>

                {selectedFile && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>
                      <Button
                        onClick={processInvoiceOCR}
                        disabled={ocrProcessing}
                        className="flex items-center gap-2"
                      >
                        {ocrProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Zpracovávám...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" />
                            Zpracovat OCR
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {ocrResults && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">OCR zpracování dokončeno</h4>
                      <Badge variant="outline" className="ml-auto">
                        Přesnost: {(ocrResults.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Číslo faktury:</span>
                          <p className="font-medium">{ocrResults.invoiceNumber}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Dodavatel:</span>
                          <p className="font-medium">{ocrResults.supplier}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Datum:</span>
                          <p className="font-medium">{ocrResults.date}</p>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Rozpoznané produkty:</h5>
                        <div className="bg-white rounded border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Popis</TableHead>
                                <TableHead>Množství</TableHead>
                                <TableHead>Cena</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ocrResults.items.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                                  <TableCell>{item.description}</TableCell>
                                  <TableCell>{item.quantity} ks</TableCell>
                                  <TableCell>{item.unitPrice.toLocaleString()} Kč</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="text-lg font-bold">Celkem: {ocrResults.total.toLocaleString()} Kč</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={clearResults}>
                            Zrušit
                          </Button>
                          <Button onClick={confirmStockUpdate} className="bg-green-600 hover:bg-green-700">
                            Potvrdit a aktualizovat sklad
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Rozložení skladu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Chodov</span>
                    <span>{stats?.totalLocations.chodov || 0} ks</span>
                  </div>
                  <Progress 
                    value={stats && stats.totalProducts > 0 ? (stats.totalLocations.chodov / stats.totalProducts) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Outlet</span>
                    <span>{stats?.totalLocations.outlet || 0} ks</span>
                  </div>
                  <Progress 
                    value={stats && stats.totalProducts > 0 ? (stats.totalLocations.outlet / stats.totalProducts) * 100 : 0} 
                    className="h-2 bg-blue-100"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Nízké zásoby
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-gray-600">{product.sku} • {product.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">{product.currentStock} ks</p>
                        <p className="text-xs text-gray-500">min: {product.minStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Invoices */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nedávné faktury
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo faktury</TableHead>
                  <TableHead>Dodavatel</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead>Položky</TableHead>
                  <TableHead>Hodnota</TableHead>
                  <TableHead>Zpracováno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Mock recent invoices - could be replaced with real API call */}
                {[
                  {
                    id: 1,
                    invoiceNumber: 'FAK-2024-001',
                    supplier: 'PIQUADRO Italia',
                    date: '2024-01-15',
                    status: 'processed',
                    items: 45,
                    totalValue: 125600,
                    processedAt: '2024-01-16 09:15'
                  },
                  {
                    id: 2,
                    invoiceNumber: 'FAK-2024-002',
                    supplier: 'PIQUADRO Italia',
                    date: '2024-01-20',
                    status: 'pending',
                    items: 32,
                    totalValue: 89400,
                    processedAt: null
                  }
                ].map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.supplier}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>
                      {invoice.status === 'processed' ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Zpracováno
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Čeká
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{invoice.items} ks</TableCell>
                    <TableCell className="font-medium">
                      {invoice.totalValue.toLocaleString()} Kč
                    </TableCell>
                    <TableCell>
                      {invoice.processedAt || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default WarehousePage