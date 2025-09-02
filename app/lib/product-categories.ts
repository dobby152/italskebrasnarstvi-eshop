// Automatická kategorizace produktů podle klíčových slov
export interface ProductCategory {
  id: string
  name: string
  icon?: string
  keywords: string[]
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'taskyKabelky',
    name: 'Tašky kabelky',
    keywords: [
      'taška', 'kabelka', 'crossbody', 'crossover', 'messenger', 
      'nákupní', 'shopping', 'přes rameno', 'camera case', 'moon bag'
    ]
  },
  {
    id: 'brasnyObaly',
    name: 'Brašny obaly',
    keywords: [
      'brašna', 'obal', 'notebook', 'laptop', 'ipad', 'tablet',
      'pracovní', 'business', 'computer', 'macbook'
    ]
  },
  {
    id: 'peněženky',
    name: 'Peněženky',
    keywords: [
      'peněženka', 'wallet', 'portmonka', 'portmonee', 
      'kreditní karty', 'mince', 'bankovky'
    ]
  },
  {
    id: 'prislusenstvi',
    name: 'Příslušenství',
    keywords: [
      'pouzdro', 'penál', 'organizér', 'agenda', 'klíče', 'klíčenka',
      'psací potřeby', 'pero', 'plánovač', 'case', 'organizer',
      'cestovní', 'kosmetická', 'kosmetick', 'oblečení', 'šaty',
      'kufřík', 'travel', 'garment', 'toiletry', 'wash',
      'nabíjecí', 'kabel', 'visačka', 'štítek', 'led', 'bezdrátová',
      'charging', 'cable', 'tag', 'luggage', 'wireless', '3v1'
    ]
  }
]

/**
 * Automaticky kategorizuje produkt na základě názvu
 */
export function categorizeProduct(productName: string): string | null {
  if (!productName) return null
  
  const normalizedName = productName.toLowerCase()
  
  // Projdeme kategorie podle priority (specifické -> obecné)
  for (const category of PRODUCT_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (normalizedName.includes(keyword.toLowerCase())) {
        return category.id
      }
    }
  }
  
  return null
}

/**
 * Získá název kategorie podle ID
 */
export function getCategoryName(categoryId: string): string {
  const category = PRODUCT_CATEGORIES.find(cat => cat.id === categoryId)
  return category?.name || 'Ostatní'
}

/**
 * Získá ikonu kategorie podle ID
 */
export function getCategoryIcon(categoryId: string): string {
  const category = PRODUCT_CATEGORIES.find(cat => cat.id === categoryId)
  return category?.icon || ''
}

/**
 * Získá všechny dostupné kategorie pro filtrování
 */
export function getAvailableCategories(): ProductCategory[] {
  return PRODUCT_CATEGORIES
}

/**
 * Filtruje produkty podle kategorie
 */
export function filterProductsByCategory(products: any[], categoryId: string): any[] {
  if (!categoryId || categoryId === 'all') return products
  
  return products.filter(product => {
    const detectedCategory = categorizeProduct(product.name || product.name_cz || '')
    return detectedCategory === categoryId
  })
}