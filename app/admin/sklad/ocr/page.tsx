"use client"

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Progress } from "../../../components/ui/progress"
import { 
  Scan, 
  Upload, 
  FileImage, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  File,
  Camera,
  Zap
} from "lucide-react"
import { useOCRProcessing } from '../../../hooks/useWarehouse'

const OCRPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  
  const { processing, results, processFile, confirmInvoice, clearResults } = useOCRProcessing()

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file)
      clearResults()
    }
  }, [clearResults])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file)
      clearResults()
    }
  }, [clearResults])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }, [])

  const processInvoiceOCR = async () => {
    if (!selectedFile) return
    
    try {
      await processFile(selectedFile)
    } catch (error) {
      console.error('OCR processing failed:', error)
    }
  }

  const confirmAndProcess = async () => {
    if (!results || !results.invoiceData) return
    
    try {
      await confirmInvoice(results.invoiceData.invoiceNumber, results.detectedProducts)
      setSelectedFile(null)
    } catch (error) {
      console.error('Failed to confirm invoice:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">OCR Zpracování faktur</h2>
        <p className="text-gray-600">Automatické zpracování faktur pomocí optického rozpoznávání textu</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Nahrát fakturu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : selectedFile 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <FileImage className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={processInvoiceOCR} disabled={processing}>
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Zpracovávám...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4 mr-2" />
                        Zpracovat OCR
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedFile(null)
                      clearResults()
                    }}
                  >
                    Zrušit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="p-4 bg-blue-100 rounded-full">
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Přetáhněte fakturu sem nebo klikněte pro výběr
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Podporované formáty: JPG, PNG, PDF (max. 10 MB)
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer">
                      <File className="h-4 w-4 mr-2" />
                      Vybrat soubor
                    </Button>
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {processing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Zpracovávání OCR...</span>
              </div>
              <Progress value={65} className="w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">1</div>
                  <div className="text-sm text-gray-600">Analýza dokumentu</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">2</div>
                  <div className="text-sm text-gray-600">Rozpoznávání textu</div>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <div className="text-lg font-bold text-gray-400">3</div>
                  <div className="text-sm text-gray-400">Párování produktů</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Informace o faktuře
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Číslo faktury</label>
                  <Input 
                    value={results.invoiceData?.invoiceNumber || ''} 
                    readOnly 
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Dodavatel</label>
                  <Input 
                    value={results.invoiceData?.supplier || ''} 
                    readOnly 
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Datum</label>
                  <Input 
                    value={results.invoiceData?.date || ''} 
                    readOnly 
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Celková částka</label>
                  <Input 
                    value={results.invoiceData?.totalAmount ? `${results.invoiceData.totalAmount} Kč` : ''} 
                    readOnly 
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Poznámky</label>
                <Textarea 
                  value="Faktura byla automaticky zpracována pomocí OCR."
                  readOnly 
                  className="mt-1 h-20"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  OCR dokončeno
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Spolehlivost: {results.confidence || 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Detected Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-purple-600" />
                Rozpoznané produkty
                <Badge variant="outline" className="ml-2">
                  {results.detectedProducts?.length || 0} položek
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {results.detectedProducts?.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.quantity} ks</p>
                      <p className="text-sm text-gray-600">{product.price} Kč</p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-6 text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Žádné produkty nebyly rozpoznány</p>
                  </div>
                )}
              </div>

              {results.detectedProducts && results.detectedProducts.length > 0 && (
                <div className="pt-4 border-t mt-4">
                  <Button 
                    onClick={confirmAndProcess}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Potvrdit a zpracovat do skladu
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default OCRPage