'use client'

import { useState, useEffect, useCallback } from 'react'
import { Product, Collection, apiClient } from '../app/lib/api-client'
import { Button } from '../app/components/ui/button'
import { Input } from '../app/components/ui/input'
import { Label } from '../app/components/ui/label'
import { Textarea } from '../app/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../app/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card'
import { Badge } from '../app/components/ui/badge'
import { Separator } from '../app/components/ui/separator'
import { AlertCircle, Save, X, Upload, Trash2, Edit3, Wand2, Clock, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '../app/components/ui/alert'
import { FileUpload } from '../app/components/ui/file-upload'
import { Switch } from '../app/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../app/components/ui/tabs'

interface ProductEditFormProps {
  product: Product
  onSave: (updatedProduct: Product) => void
  onCancel: () => void
  isLoading?: boolean
}

interface FormData {
  name: string
  collection: string
  description: string
  sku: string
  price: number
  brand: string
  availability: string
  image_url: string
  images: string
}

interface UploadedImage {
  file: File
  preview: string
}

interface FormErrors {
  [key: string]: string
}

const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'Skladem' },
  { value: 'out_of_stock', label: 'Vyprodáno' },
  { value: 'pre_order', label: 'Předobjednávka' },
  { value: 'discontinued', label: 'Ukončeno' }
]

export function ProductEditForm({ product, onSave, onCancel, isLoading = false }: ProductEditFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: product.name || '',
    collection: product.collection || '',
    description: product.description || '',
    sku: product.sku || '',
    price: product.price || 0,
    brand: product.brand || '',
    availability: product.availability || 'in_stock',
    image_url: product.image_url || '',
    images: product.images?.join(', ') || ''
  })

  const [collections, setCollections] = useState<Collection[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])

  // Načtení kolekcí
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const collectionsData = await apiClient.getCollections()
        setCollections(collectionsData)
      } catch (error) {
        console.error('Chyba při načítání kolekcí:', error)
      }
    }
    fetchCollections()
  }, [])

  // Funkce pro zpracování nahraných souborů
  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files)
    setIsDirty(true)
  }

  const handleRemoveExistingImage = (index: number) => {
    const newImages = existingImages.filter((_, i) => i !== index)
    setExistingImages(newImages)
    setIsDirty(true)
  }

  // Funkce pro nahrání souborů na server
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = []
    
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const result = await response.json()
          uploadedUrls.push(result.url)
        } else {
          throw new Error(`Chyba při nahrávání souboru ${file.name}`)
        }
      } catch (error) {
        console.error('Chyba při nahrávání:', error)
        throw error
      }
    }
    
    return uploadedUrls
  }

  // Inicializace formuláře s daty produktu
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        collection: product.collection || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price || 0,
        brand: product.brand || '',
        availability: product.availability || 'in_stock',
        image_url: product.image_url || '',
        images: product.images?.join(', ') || ''
      })
      
      // Inicializace existujících obrázků
      const images: string[] = []
      if (product.image_url) images.push(product.image_url)
      if (product.images && Array.isArray(product.images)) {
        images.push(...product.images)
      } else if (product.images && typeof product.images === 'string') {
        const imageList = (product.images as string).split(',').map((img: string) => img.trim()).filter(Boolean)
        images.push(...imageList)
      }
      setExistingImages(images)
    }
  }, [product])

  // Sledování změn ve formuláři
  useEffect(() => {
    const hasChanges = Object.keys(formData).some(key => {
      const currentValue = formData[key as keyof FormData]
      const originalValue = product[key as keyof Product]
      return currentValue !== originalValue
    })
    setIsDirty(hasChanges)
  }, [formData, product])

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Vymazání chyby pro dané pole
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Povinná pole
    if (!formData.name.trim()) {
      newErrors.name = 'Název produktu je povinný'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Název produktu musí mít alespoň 3 znaky'
    } else if (formData.name.length > 200) {
      newErrors.name = 'Název produktu může mít maximálně 200 znaků'
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU je povinné'
    } else if (!/^[A-Z0-9-_]+$/i.test(formData.sku)) {
      newErrors.sku = 'SKU může obsahovat pouze písmena, číslice, pomlčky a podtržítka'
    } else if (formData.sku.length < 2) {
      newErrors.sku = 'SKU musí mít alespoň 2 znaky'
    } else if (formData.sku.length > 50) {
      newErrors.sku = 'SKU může mít maximálně 50 znaků'
    }

    if (formData.price <= 0) {
      newErrors.price = 'Cena musí být větší než 0'
    } else if (formData.price > 999999) {
      newErrors.price = 'Cena nemůže být větší než 999,999 Kč'
    }

    // Validace popisu
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Popis může mít maximálně 2000 znaků'
    }

    // Validace značky
    if (formData.brand && formData.brand.length > 100) {
      newErrors.brand = 'Značka může mít maximálně 100 znaků'
    }

    // Validace URL obrázků
    if (formData.images) {
      const urls = formData.images.split(',').map(url => url.trim()).filter(url => url)
      const invalidUrls = urls.filter(url => {
        try {
          const urlObj = new URL(url)
          return !['http:', 'https:'].includes(urlObj.protocol)
        } catch {
          return true
        }
      })
      if (invalidUrls.length > 0) {
        newErrors.images = 'Některé URL obrázků nejsou platné (musí začínat http:// nebo https://)'
      }
      if (urls.length > 10) {
        newErrors.images = 'Můžete zadat maximálně 10 URL obrázků'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element?.focus()
      }
      return
    }

    setIsSubmitting(true)
    setErrors({})
    
    try {
      let updatedFormData = { ...formData }
      
      // Nahrát nové soubory, pokud existují
      if (uploadedFiles.length > 0) {
        try {
          const uploadedUrls = await uploadFiles(uploadedFiles)
          
          // Kombinovat existující a nové obrázky
          const allImages = [...existingImages, ...uploadedUrls]
          
          // Aktualizovat form data s novými URL
          if (allImages.length > 0) {
            updatedFormData.images = allImages.join(', ')
          }
        } catch (uploadError) {
          setErrors({ submit: 'Chyba při nahrávání obrázků. Zkuste to prosím znovu.' })
          return
        }
      } else {
        // Použít pouze existující obrázky
        updatedFormData.images = existingImages.join(', ')
      }
      
      // Convert images string to array for API call
      const productUpdateData = {
        ...updatedFormData,
        images: updatedFormData.images ? updatedFormData.images.split(',').map(url => url.trim()).filter(Boolean) : []
      }
      
      const updatedProduct = await apiClient.updateProduct(product.id, productUpdateData)
      onSave(updatedProduct)
      setIsDirty(false)
      setUploadedFiles([]) // Vymazat nahrané soubory po úspěšném uložení
    } catch (error: any) {
      console.error('Chyba při ukládání produktu:', error)
      
      // Handle specific error types
      if (error.response?.status === 409) {
        setErrors({ sku: 'SKU již existuje, zvolte jiné' })
      } else if (error.response?.status === 400) {
        const errorData = error.response?.data
        if (errorData?.errors) {
          setErrors(errorData.errors)
        } else {
          setErrors({ submit: errorData?.message || 'Neplatná data formuláře' })
        }
      } else if (error.response?.status === 404) {
        setErrors({ submit: 'Produkt nebyl nalezen' })
      } else if (error.response?.status >= 500) {
        setErrors({ submit: 'Chyba serveru, zkuste to prosím později' })
      } else {
        setErrors({ submit: error.message || 'Došlo k neočekávané chybě při ukládání produktu' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Máte neuložené změny. Opravdu chcete zrušit úpravy?')) {
        onCancel()
      }
    } else {
      onCancel()
    }
  }

  return (
    <div className="max-w-none">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chybová zpráva */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

      {/* Základní informace */}
      <Card>
        <CardHeader>
          <CardTitle>Základní informace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Název produktu *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Zadejte název produktu"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                placeholder="Zadejte SKU"
                className={errors.sku ? 'border-red-500' : ''}
              />
              {errors.sku && (
                <p className="text-sm text-red-500">{errors.sku}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Popis produktu</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Zadejte popis produktu"
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-sm text-gray-500">
              {formData.description.length}/2000 znaků
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Kategorizace a značka */}
      <Card>
        <CardHeader>
          <CardTitle>Kategorizace a značka</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="collection">Kolekce</Label>
              <Select
                value={formData.collection}
                onValueChange={(value) => handleInputChange('collection', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte kolekci" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Bez kolekce</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.name} value={collection.name}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Značka</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="Zadejte značku"
                className={errors.brand ? 'border-red-500' : ''}
              />
              {errors.brand && (
                <p className="text-sm text-red-500">{errors.brand}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cena a dostupnost */}
      <Card>
        <CardHeader>
          <CardTitle>Cena a dostupnost</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Cena (Kč) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Dostupnost</Label>
              <Select
                value={formData.availability}
                onValueChange={(value) => handleInputChange('availability', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte dostupnost" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Obrázky */}
      <Card>
        <CardHeader>
          <CardTitle>Obrázky produktu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUpload
            onFilesChange={handleFilesChange}
            maxFiles={10}
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            maxFileSize={5}
            disabled={isSubmitting || isLoading}
            existingImages={existingImages}
            onRemoveExisting={handleRemoveExistingImage}
          />
          
          {/* Fallback textová pole pro pokročilé uživatele */}
          <div className="border-t pt-4">
            <details className="space-y-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Pokročilé možnosti (textová pole)
              </summary>
              
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">Hlavní obrázek (URL)</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => handleInputChange('image_url', e.target.value)}
                    placeholder="URL hlavního obrázku produktu"
                    className={errors.image_url ? 'border-red-500' : ''}
                  />
                  {errors.image_url && (
                    <p className="text-sm text-red-500">{errors.image_url}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Zadejte URL hlavního obrázku produktu
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">Dodatečné obrázky (URL)</Label>
                  <Textarea
                    id="images"
                    value={formData.images}
                    onChange={(e) => handleInputChange('images', e.target.value)}
                    placeholder="URL adres dodatečných obrázků (oddělené čárkami)"
                    rows={3}
                    className={errors.images ? 'border-red-500' : ''}
                  />
                  {errors.images && (
                    <p className="text-sm text-red-500">{errors.images}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Zadejte URL adresy dodatečných obrázků oddělené čárkami (max. 10)
                    {formData.images && (
                      <span className="ml-2 font-medium">
                        {formData.images.split(',').filter(url => url.trim()).length}/10 URL
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Akční tlačítka */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {isDirty && (
            <Badge variant="outline" className="text-orange-600">
              Neuložené změny
            </Badge>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting || isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Zrušit
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || isLoading || !isDirty}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Ukládám...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Uložit změny
              </>
            )}
          </Button>
        </div>
      </div>
      </form>
    </div>
  )
}