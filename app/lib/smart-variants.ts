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
  'M': { name: 'Muse - Hnědá', hex: '#8B4513' },
  'MO': { name: 'Hnědá', hex: '#8B4513' },
  'CU': { name: 'Koňak', hex: '#CD853F' },
  'TM': { name: 'Tmavě hnědá', hex: '#654321' },
  'BLU4': { name: 'Tmavě modrá', hex: '#1E3A8A' },
  'VE2': { name: 'Zelená', hex: '#059669' },
  'VE': { name: 'Zelená', hex: '#059669' },
  'BO': { name: 'Bordeaux', hex: '#722F37' },
  'AR': { name: 'Stříbrná', hex: '#C0C0C0' },
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
      stock: product.totalStock || product.stock || 0
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
  
  console.log(`🔍 FilterImagesByColor: Looking for colorCode "${colorCode}" in ${images.length} images`)
  
  const filteredImages = images.filter(imageUrl => {
    // Extract filename from path to check for color code
    // URL format: folder/8_OM5285OM5-N_1.jpg or https://example.com/folder/8_OM5285OM5-N_1.jpg
    const pathParts = imageUrl.split('/')
    const fileName = pathParts[pathParts.length - 1] || '' // Get filename
    
    console.log(`📁 Checking filename: ${fileName} for color: ${colorCode}`)
    
    // Check if filename contains the color code
    // Examples: 8_OM5285OM5-N_1.jpg, 1_OM5285OM5-BLU_1.jpg
    const patterns = [
      new RegExp(`-${colorCode.toUpperCase()}(_|\\.|$)`, 'i'),    // Exact match: SKU-COLOR_ or SKU-COLOR.
      new RegExp(`-${colorCode.toUpperCase()}\\d*(_|\\.|$)`, 'i'), // With number: SKU-COLOR2_
      new RegExp(`${colorCode.toUpperCase()}(_|\\.|$)`, 'i'),     // Just color: SKUCOLOR_
    ]
    
    const matches = patterns.some(pattern => pattern.test(fileName))
    console.log(`✅ ${fileName} matches ${colorCode}: ${matches}`)
    
    return matches
  });
  
  console.log(`🎨 Found ${filteredImages.length} images for color ${colorCode}:`, filteredImages)
  
  // If no color-specific images found, return first few images as fallback
  if (filteredImages.length === 0 && images.length > 0) {
    console.log(`⚠️ No specific images found for ${colorCode}, using fallback`)
    return images.slice(0, 3); // Return first 3 images as fallback
  }
  
  return filteredImages;
}

/**
 * Get alternative color code aliases for better image matching
 */
function getColorAliases(colorCode: string): string[] {
  const aliases: Record<string, string[]> = {
    'N': ['NERO', 'BLACK', 'BLK'],
    'NERO': ['N', 'BLACK', 'BLK'],
    'R': ['RED', 'ROSSO'],
    'BLU': ['BLUE', 'BLU2'],
    'BLU2': ['BLU', 'BLUE'],
    'CU': ['CUOIO', 'COGNAC'],
    'MO': ['MARRONE', 'BROWN'],
    'GR': ['GREY', 'GRAY'],
    'VE': ['VERDE', 'GREEN']
  };
  
  return aliases[colorCode.toUpperCase()] || [];
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
    
    // If no specific images found, try to find images by trying common color variations
    let finalImages = colorSpecificImages;
    if (finalImages.length === 0 && (product.images || []).length > 0) {
      // Try alternative color codes (sometimes colors have aliases)
      const colorAliases = getColorAliases(variantCode);
      for (const alias of colorAliases) {
        const aliasImages = filterImagesByColor(product.images || [], alias);
        if (aliasImages.length > 0) {
          finalImages = aliasImages;
          console.log(`🔄 Found images using color alias: ${alias} for ${variantCode}`);
          break;
        }
      }
    }
    
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      colorCode: variantCode,
      colorName: colorInfo.name,
      hexColor: colorInfo.hex,
      price: product.price || 0,
      images: finalImages,
      availability: product.availability || 'in_stock',
      stock: product.totalStock || product.stock || 0
    };
  });
}