// Smart variant detection without database changes
export interface VariantGroup {
  baseName: string;
  baseSkuPattern: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  sku: string;
  name: string;
  colorCode: string;
  colorName: string;
  hexColor: string;
  price: number;
  images: string[];
  availability: string;
  stock: number;
}

// Color mapping for Italian leather goods
const COLOR_MAP: Record<string, { name: string; hex: string }> = {
  // Basic colors
  'BLK': { name: 'Černá', hex: '#000000' },
  'WHT': { name: 'Bílá', hex: '#FFFFFF' },
  'BLU': { name: 'Modrá', hex: '#1E40AF' },
  'RED': { name: 'Červená', hex: '#DC2626' },
  'GRN': { name: 'Zelená', hex: '#16A34A' },
  'GR': { name: 'Šedá', hex: '#6B7280' },
  'BR': { name: 'Hnědá', hex: '#92400E' },
  
  // Italian leather specific
  'R': { name: 'Růžová', hex: '#EC4899' },
  'ROSE': { name: 'Růžová', hex: '#EC4899' },
  'G': { name: 'Zelená', hex: '#16A34A' },
  'AZBE2': { name: 'Azurová modrá', hex: '#3B82F6' },
  'BI': { name: 'Bílá', hex: '#F8FAFC' },
  'N': { name: 'Černá', hex: '#111827' },
  'NERO': { name: 'Černá', hex: '#111827' },
  'MARRONE': { name: 'Hnědá', hex: '#92400E' },
  'BEI': { name: 'Béžová', hex: '#D4B896' },
  'BEIGE': { name: 'Béžová', hex: '#D4B896' },
  'CUOIO': { name: 'Kožená', hex: '#CD853F' },
  'COGNAC': { name: 'Koňak', hex: '#8B4513' },
  'TAN': { name: 'Tan', hex: '#D2691E' },
  'CAMEL': { name: 'Velbloudí', hex: '#C19A6B' },
  'DEFAULT': { name: 'Výchozí', hex: '#6B7280' }
};

/**
 * Normalize product name by removing color words
 */
export function normalizeProductName(name: string): string {
  return name
    .replace(/\b(černá|bílá|modrá|červená|zelená|šedá|hnědá|růžová|béžová|azurová)\b/gi, '')
    .replace(/\b(black|white|blue|red|green|grey|gray|brown|pink|beige|rose|azure)\b/gi, '')
    .replace(/\b(nero|bianco|blu|rosso|verde|grigio|marrone|rosa|beige|azzurro)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract base SKU pattern (everything before last hyphen)
 */
export function extractBaseSku(sku: string): string {
  const lastHyphenIndex = sku.lastIndexOf('-');
  return lastHyphenIndex > 0 ? sku.substring(0, lastHyphenIndex) : sku;
}

/**
 * Extract variant code (everything after last hyphen)
 */
export function extractVariantCode(sku: string): string {
  const lastHyphenIndex = sku.lastIndexOf('-');
  return lastHyphenIndex > 0 ? sku.substring(lastHyphenIndex + 1) : 'DEFAULT';
}

/**
 * Get color info from variant code
 */
export function getColorInfo(variantCode: string): { name: string; hex: string } {
  const colorInfo = COLOR_MAP[variantCode.toUpperCase()];
  if (colorInfo) {
    return colorInfo;
  }
  
  // Fallback for unknown color codes
  return {
    name: variantCode.charAt(0).toUpperCase() + variantCode.slice(1).toLowerCase(),
    hex: '#6B7280'
  };
}

/**
 * Group products into variants dynamically
 */
export function groupProductsIntoVariants(products: any[]): Map<string, VariantGroup> {
  const groups = new Map<string, VariantGroup>();

  products.forEach(product => {
    if (!product.name || !product.sku) return;

    const baseName = normalizeProductName(product.name);
    const baseSku = extractBaseSku(product.sku);
    const variantCode = extractVariantCode(product.sku);
    const colorInfo = getColorInfo(variantCode);
    
    const groupKey = `${baseName}|${baseSku}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        baseName,
        baseSkuPattern: baseSku,
        variants: []
      });
    }

    const variant: ProductVariant = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      colorCode: variantCode,
      colorName: colorInfo.name,
      hexColor: colorInfo.hex,
      price: product.price || 0,
      images: product.images || [],
      availability: product.availability || 'in_stock',
      stock: product.stock || 10
    };

    groups.get(groupKey)!.variants.push(variant);
  });

  return groups;
}

/**
 * Find variant group for a specific product SKU
 */
export function findVariantGroupBySku(products: any[], targetSku: string): VariantGroup | null {
  const groups = groupProductsIntoVariants(products);
  
  for (const group of groups.values()) {
    if (group.variants.some(v => v.sku === targetSku)) {
      return group;
    }
  }
  
  return null;
}

/**
 * Filter images by color variant code from image filenames
 */
export function filterImagesByColor(images: string[], colorCode: string): string[] {
  if (!images || images.length === 0) return [];
  
  const filteredImages = images.filter(imageUrl => {
    // Extract filename from URL
    const filename = imageUrl.split('/').pop() || '';
    
    // Look for color code pattern in filename like CA3214B3-N_ or CA3214B3-CU_
    const colorPattern = new RegExp(`-${colorCode.toUpperCase()}_`, 'i');
    return colorPattern.test(filename);
  });
  
  // If no color-specific images found, return first few images as fallback
  if (filteredImages.length === 0 && images.length > 0) {
    return images.slice(0, 3); // Return first 3 images as fallback
  }
  
  return filteredImages;
}

/**
 * Get all variants for a base SKU
 */
export function getVariantsForBaseSku(products: any[], baseSku: string): ProductVariant[] {
  const relatedProducts = products.filter(p => extractBaseSku(p.sku) === baseSku);
  
  return relatedProducts.map(product => {
    const variantCode = extractVariantCode(product.sku);
    const colorInfo = getColorInfo(variantCode);
    
    // Filter images to show only those matching this color variant
    const colorSpecificImages = filterImagesByColor(product.images || [], variantCode);
    
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      colorCode: variantCode,
      colorName: colorInfo.name,
      hexColor: colorInfo.hex,
      price: product.price || 0,
      images: colorSpecificImages,
      availability: product.availability || 'in_stock',
      stock: product.stock || 10
    };
  });
}