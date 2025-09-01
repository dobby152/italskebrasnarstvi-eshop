export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Existing functions
export const getImageUrl = (imagePath: string | undefined | null) => {
  // If it's already a full URL, return as is
  if (imagePath && imagePath.startsWith('http')) {
    return imagePath
  }
  
  // If imagePath is null/undefined, return placeholder
  if (!imagePath) {
    return '/placeholder.svg'
  }
  
  // Remove any leading slashes and 'images/' prefix to get just filename
  const cleanPath = imagePath.replace(/^\/+|images\//g, '')
  
  // Use the API route to handle image lookup and serving
  return `/api/images/${cleanPath}`
};

export const getProductDisplayName = (product: any) => {
  let name = product.name_cz || product.name || 'Neznámý produkt'
  
  // Remove SKU pattern from name if present
  if (product.sku) {
    // Remove SKU at the beginning or end of the name
    name = name.replace(new RegExp(`^${product.sku}\\s*[-_]?\\s*`, 'i'), '')
    name = name.replace(new RegExp(`\\s*[-_]?\\s*${product.sku}$`, 'i'), '')
  }
  
  // Remove common SKU patterns - but only if they look like SKUs (contain numbers/dashes/underscores)
  // Only remove patterns that contain both letters AND numbers/special chars, not just letters
  name = name.replace(/^[A-Z]+[0-9-_]+[A-Z0-9-_]*\s*[-_]?\s*/, '') // Remove leading SKU-like codes (must have letters+numbers)
  name = name.replace(/\s*[-_]?\s*[A-Z]+[0-9-_]+[A-Z0-9-_]*$/, '') // Remove trailing SKU-like codes
  
  return name.trim() || 'Neznámý produkt'
};

export const getProductDisplayCollection = (product: any) => {
  return product.collection_cz || product.collection || 'Neznámá kolekce'
};

export const getProductDisplayDescription = (product: any) => {
  let description = product.description_cz || product.description || ''
  
  // Clean up description if it contains SKU or redundant info
  if (product.sku && description.includes(product.sku)) {
    description = description.replace(new RegExp(product.sku, 'gi'), '').trim()
  }
  
  return description
};

export const transformProduct = (product: any) => {
  return {
    id: product.id,
    name: getProductDisplayName(product),
    collection: getProductDisplayCollection(product), 
    description: getProductDisplayDescription(product),
    image: product.image_url || (product.images?.[0] ? getImageUrl(product.images[0]) : null),
    mainImage: product.image_url || (product.images?.[0] ? getImageUrl(product.images[0]) : null),
    images: product.images ? product.images?.map((image: any) => getImageUrl(image)) : [],
    tags: product.tags,
    availability: product.stock > 0 ? 'in_stock' : 'out_of_stock',
    price: product.price || 0,
    sku: product.sku
  };
};

// New functions
const sendToAnalytics = (data: { event: string; element?: string; form?: string }) => {
  window.ga('send', 'event', data.event, data.element || data.form);
  // Implement actual analytics service call here
};

export const trackClick = (elementId: string) => {
  sendToAnalytics({ event: 'click', element: elementId });
};

export const trackForm = (formId: string) => {
  sendToAnalytics({ event: 'form_submission', form: formId });
};