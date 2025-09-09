"use client"

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 85,
  placeholder = 'empty',
  blurDataURL
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Generate a simple blur data URL for placeholder
  const generateBlurDataURL = () => {
    if (blurDataURL) return blurDataURL
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx4f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyejVvzgB2HfVe4wvRzBhh1EWGmAe5sF14cQWNYUUUWGuVzgdThJdidNUx4NRQBByTjNwD+TmYiGn6ZpjLqHmppzHvQNvx+K/F5bQ='
  }

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Image not available</span>
      </div>
    )
  }

  const imageProps: any = {
    src,
    alt,
    className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`,
    priority,
    quality,
    onLoad: () => setIsLoading(false),
    onError: () => setError(true),
  }

  if (fill) {
    imageProps.fill = true
    imageProps.sizes = sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  } else if (width && height) {
    imageProps.width = width
    imageProps.height = height
  }

  if (placeholder === 'blur') {
    imageProps.placeholder = 'blur'
    imageProps.blurDataURL = generateBlurDataURL()
  }

  return (
    <div className="relative overflow-hidden">
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-100 animate-pulse ${className}`} />
      )}
      <Image {...imageProps} />
    </div>
  )
}