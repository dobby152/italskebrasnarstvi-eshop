import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Extract product ID from slug (format: product-name-ID)
export function extractIdFromSlug(slug: string): string | null {
  const parts = slug.split('-')
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1]
    if (lastPart && /^\d+$/.test(lastPart)) {
      return lastPart
    }
  }
  // If no numeric ID found, log for debugging
  console.warn('No valid ID found in slug:', slug)
  return null
}

// Format price in Czech format
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// Get image URL with proper path handling
export function getImageUrl(imagePath: string | undefined | null): string {
  // Handle undefined/null cases
  if (!imagePath || typeof imagePath !== 'string') {
    return '/placeholder.svg'
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // If it already starts with /images/, return as is
  if (imagePath.startsWith('/images/')) {
    return imagePath
  }
  
  // If it's just the filename, add the /images/ prefix
  return `/images/${imagePath.replace(/^\/+/, '')}`
}

// Get product display name (remove SKU from title)
export function getProductDisplayName(product: any): string {
  let name = product.name_cz || product.name || 'Neznámý produkt'
  
  // Remove SKU pattern from name if present
  if (product.sku) {
    // Remove SKU at the beginning or end of the name
    name = name.replace(new RegExp(`^${product.sku}\s*[-_]?\s*`, 'i'), '')
    name = name.replace(new RegExp(`\s*[-_]?\s*${product.sku}$`, 'i'), '')
  }
  
  // Remove common SKU patterns - but only if they look like SKUs (contain numbers/dashes/underscores)
  // Only remove patterns that contain both letters AND numbers/special chars, not just letters
  name = name.replace(/^[A-Z]+[0-9-_]+[A-Z0-9-_]*\s*[-_]?\s*/, '') // Remove leading SKU-like codes (must have letters+numbers)
  name = name.replace(/\s*[-_]?\s*[A-Z]+[0-9-_]+[A-Z0-9-_]*$/, '') // Remove trailing SKU-like codes
  
  return name.trim() || 'Neznámý produkt'
}

// Get product display collection
export function getProductDisplayCollection(product: any): string {
  return product.collection_cz || product.collection || 'Neznámá kolekce'
}

// Get product display description
export function getProductDisplayDescription(product: any): string {
  let description = product.description_cz || product.description || ''
  
  // Clean up description if it contains SKU or redundant info
  if (product.sku && description.includes(product.sku)) {
    description = description.replace(new RegExp(product.sku, 'gi'), '').trim()
  }
  
  return description
}

// Create product slug from name and ID
export function createProductSlug(product: any): string {
  const name = getProductDisplayName(product)
  const slug = name
    .toLowerCase()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
  
  // Ensure product has a valid ID
  if (!product.id) {
    console.warn('Product missing ID:', product)
    return slug // Return slug without ID if ID is missing
  }
  
  return `${slug}-${product.id}`
}
