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
  Activity
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

// Mock data for demonstration
const warehouseStats = {
  totalProducts: 1247,
  totalValue: 2847650,
  lowStockAlerts: 23,
  recentMovements: 156,
  totalLocations: {
    chodov: 847,
    outlet: 400
  }
}

const recentInvoices = [
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
]

const lowStockProducts = [
  { sku: 'BD3336W92-AZBE2', name: 'Pánská aktovka Blue Square', currentStock: 2, minStock: 5, location: 'Chodov' },
  { sku: 'CA4818AP-GR', name: 'Dámská kabelka Circle', currentStock: 1, minStock: 3, location: 'Outlet' },
  { sku: 'CA6637W129-BLU', name: 'Peněženka Black Square', currentStock: 0, minStock: 10, location: 'Oba' }
]

const WarehousePage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [ocrResults, setOcrResults] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('all')

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setOcrResults(null)
    }
  }, [])

  const processInvoiceOCR = async () => {
    if (!selectedFile) return
    
    setOcrProcessing(true)
    
    // Simulate OCR processing with Tesseract
    setTimeout(() => {
      // Mock OCR results
      const mockResults = {
        invoiceNumber: 'FAK-2024-003',
        supplier: 'PIQUADRO Italia S.r.l.',
        date: '2024-01-25',
        items: [
          { sku: 'BD3336W92-N', description: 'Briefcase Blue Square', quantity: 5, unitPrice: 4200 },
          { sku: 'CA4818AP-TM', description: 'Lady bag Circle', quantity: 3, unitPrice: 3800 },
          { sku: 'CA6637W129-BLU', description: 'Wallet Black Square', quantity: 10, unitPrice: 1200 }
        ],
        total: 52600,
        confidence: 0.94
      }
      
      setOcrResults(mockResults)
      setOcrProcessing(false)
    }, 3000)
  }

  const confirmStockUpdate = () => {
    // Here we would update the stock levels based on OCR results
    alert('Skladové zásoby byly aktualizovány!')
    setOcrResults(null)
    setSelectedFile(null)
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
                  <p className="text-2xl font-bold text-gray-900">{warehouseStats.totalProducts}</p>
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
                    {(warehouseStats.totalValue / 1000).toFixed(0)}K Kč
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
                  <p className="text-2xl font-bold text-yellow-600">{warehouseStats.lowStockAlerts}</p>
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
                  <p className="text-2xl font-bold text-purple-600">{warehouseStats.recentMovements}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* OCR Invoice Processing */}
          <div className="lg:col-span-2">
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
                          <Button variant="outline" onClick={() => setOcrResults(null)}>
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
                    <span>{warehouseStats.totalLocations.chodov} ks</span>
                  </div>
                  <Progress 
                    value={(warehouseStats.totalLocations.chodov / warehouseStats.totalProducts) * 100} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Outlet</span>
                    <span>{warehouseStats.totalLocations.outlet} ks</span>
                  </div>
                  <Progress 
                    value={(warehouseStats.totalLocations.outlet / warehouseStats.totalProducts) * 100} 
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
                {recentInvoices.map((invoice) => (
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