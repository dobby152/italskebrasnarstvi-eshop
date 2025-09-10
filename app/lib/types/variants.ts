export interface VariantAttribute {
  name: string
  displayName: string
  type: 'color' | 'select' | 'text'
  value: string
  displayValue: string
  hexColor?: string
}

export interface VariantImage {
  id: number
  variant_id: number
  image_url: string
  alt_text?: string
  sort_order: number
  is_featured: boolean
  image_type: 'product' | 'detail' | 'lifestyle' | 'swatch' | 'main'
}

export interface ProductVariant {
  id: number
  base_product_id: number
  sku: string
  name: string
  price: number
  compare_at_price?: number
  inventory_quantity: number
  inventory_policy: 'deny' | 'continue'
  weight?: number
  requires_shipping: boolean
  url?: string
  status: 'active' | 'inactive' | 'out_of_stock'
  availability: string
  featured_image?: string
  attributes: { [key: string]: VariantAttribute }
  images: VariantImage[]
  created_at: string
  updated_at: string
}

export interface BaseProduct {
  id: number
  name: string
  description?: string
  category_id?: number
  subcategory_id?: number
  brand_id?: number
  normalized_brand?: string
  collection_id?: number
  normalized_collection?: string
  base_sku: string
  status: 'active' | 'inactive' | 'discontinued'
  created_at: string
  updated_at: string
}

export interface VariantGroup {
  baseProduct: BaseProduct
  variants: ProductVariant[]
  selectedVariant?: ProductVariant
}

export interface VariantAttributeOption {
  value: string
  displayValue: string
  hexColor?: string
  available: boolean
  price?: number
}

export interface VariantSelectorProps {
  variantGroup: VariantGroup
  selectedVariant: ProductVariant
  onVariantChange: (variant: ProductVariant) => void
  className?: string
}

export interface ColorSelectorProps {
  colors: VariantAttributeOption[]
  selectedColor?: string
  onColorChange: (color: string) => void
  className?: string
}

export interface SizeSelectorProps {
  sizes: VariantAttributeOption[]
  selectedSize?: string
  onSizeChange: (size: string) => void
  className?: string
}

// Pomocné typy pro košík
export interface CartItem {
  id: string
  variantId: number
  baseSku: string
  sku: string
  name: string
  price: number
  quantity: number
  image?: string
  attributes: { [key: string]: VariantAttribute }
}

export interface CartContextType {
  items: CartItem[]
  addItem: (variant: ProductVariant, quantity: number) => Promise<void>
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => Promise<void>
  clearCart: () => void
  totalPrice: number
  totalItems: number
}

// API Response typy
export interface VariantsApiResponse {
  baseProduct?: BaseProduct
  variants?: ProductVariant[]
  baseProducts?: (BaseProduct & { product_variants: { count: number }[] })[]
  success: boolean
  error?: string
}

export interface VariantFilters {
  colors?: string[]
  sizes?: string[]
  priceRange?: [number, number]
  inStock?: boolean
}