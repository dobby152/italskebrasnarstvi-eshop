"use client"

import * as React from "react"
import { cn } from "../app/lib/utils"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "../app/components/ui/button"

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  maxFileSize?: number // in MB
  className?: string
  disabled?: boolean
  existingImages?: string[]
  onRemoveExisting?: (index: number) => void
}

export function FileUpload({
  onFilesChange,
  maxFiles = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 5,
  className,
  disabled = false,
  existingImages = [],
  onRemoveExisting
}: FileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([])
  const [previews, setPreviews] = React.useState<string[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)

  const totalImages = existingImages.length + uploadedFiles.length

  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return

    const validFiles: File[] = []
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        alert(`Soubor ${file.name} má nepodporovaný formát. Podporované formáty: ${acceptedTypes.join(', ')}`)
        continue
      }

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`Soubor ${file.name} je příliš velký. Maximální velikost: ${maxFileSize}MB`)
        continue
      }

      // Check total count
      if (totalImages + validFiles.length >= maxFiles) {
        alert(`Můžete nahrát maximálně ${maxFiles} obrázků`)
        break
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      const newFiles = [...uploadedFiles, ...validFiles]
      setUploadedFiles(newFiles)
      onFilesChange(newFiles)

      // Create previews
      const newPreviews = [...previews]
      validFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string)
            setPreviews([...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removeUploadedFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    setPreviews(newPreviews)
    onFilesChange(newFiles)
  }

  const openFileDialog = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.click()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed",
          totalImages >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || totalImages >= maxFiles}
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            {totalImages >= maxFiles 
              ? `Dosáhli jste limitu ${maxFiles} obrázků`
              : "Klikněte nebo přetáhněte obrázky sem"
            }
          </p>
          <p className="text-xs text-gray-500">
            Podporované formáty: JPEG, PNG, WebP (max. {maxFileSize}MB)
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {totalImages}/{maxFiles} obrázků
          </p>
        </div>
      </div>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Současné obrázky</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {existingImages.map((imageUrl, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imageUrl}
                    alt={`Obrázek ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                {onRemoveExisting && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveExisting(index)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Nové obrázky</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={`uploaded-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {previews[index] ? (
                    <img
                      src={previews[index]}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeUploadedFile(index)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="bg-black/50 text-white text-xs p-1 rounded truncate">
                    {file.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}