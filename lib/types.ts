// Enhanced types for improved product categorization system

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  description?: string
  image?: string
  display_order: number
  is_active: boolean
  gender?: 'men' | 'women' | 'unisex'
  seo_title?: string
  seo_description?: string
  created_at?: string
  updated_at?: string
}

export interface Subcategory {
  id: string
  name: string
  slug: string
  category_id: string
  description?: string
  display_order: number
  is_active: boolean
  gender?: 'men' | 'women' | 'unisex'
  seo_title?: string
  seo_description?: string
}

export interface ProductFeature {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  name: string
  color?: string
  size?: string
  material?: string
  price_modifier: number // Can be positive or negative
  stock_quantity: number
  image?: string
  is_active: boolean
}

export interface EnhancedProduct {
  id: number
  name_cz: string
  collection_cz?: string
  description_cz?: string
  sku: string
  base_price: number
  brand?: string
  availability: 'in_stock' | 'out_of_stock' | 'low_stock' | 'pre_order'
  local_images?: string
  online_images?: string
  images: string[]
  mainImage?: string
  created_at?: string
  updated_at?: string
  
  // Enhanced categorization
  category_id?: string
  subcategory_id?: string
  gender: 'men' | 'women' | 'unisex'
  target_audience?: string[]
  
  // Product features and specifications
  features: ProductFeature[]
  material?: string
  color?: string
  dimensions?: {
    width: number
    height: number
    depth: number
    weight?: number
  }
  care_instructions?: string
  warranty_period?: number
  
  // Variants
  variants: ProductVariant[]
  
  // SEO
  slug: string
  meta_title?: string
  meta_description?: string
  
  // Tags (existing system)
  tags?: Tag[]
  
  // Legacy compatibility
  name?: string
  collection?: string
  description?: string
  price: number
  stock?: number
  image?: string
}

export interface Tag {
  id: number
  name: string
  color: string
}

// Navigation structure for improved menu system
export interface NavigationCategory {
  id: string
  name: string
  slug: string
  href: string
  gender?: 'men' | 'women' | 'unisex'
  children?: NavigationSubcategory[]
  features?: NavigationFeature[]
  isActive: boolean
  displayOrder: number
}

export interface NavigationSubcategory {
  id: string
  name: string
  slug: string
  href: string
  gender?: 'men' | 'women' | 'unisex'
  isActive: boolean
  displayOrder: number
}

export interface NavigationFeature {
  id: string
  name: string
  slug: string
  href: string
  icon?: string
  isActive: boolean
  displayOrder: number
}

// Filter interfaces for improved product filtering
export interface ProductFilters {
  category?: string[]
  subcategory?: string[]
  brand?: string[]
  gender?: ('men' | 'women' | 'unisex')[]
  priceRange?: {
    min: number
    max: number
  }
  features?: string[]
  colors?: string[]
  materials?: string[]
  availability?: ('in_stock' | 'out_of_stock' | 'low_stock' | 'pre_order')[]
  search?: string
  sortBy?: 'price' | 'name' | 'created_at' | 'popularity'
  sortOrder?: 'asc' | 'desc'
}

export interface CategoryHierarchy {
  men: NavigationCategory[]
  women: NavigationCategory[]
  unisex: NavigationCategory[]
}

// Static category structure based on actual product data
export const STATIC_CATEGORIES: CategoryHierarchy = {
  men: [
    {
      id: 'men-bags',
      name: 'Pánské tašky a batohy',
      slug: 'panske-tasky-batohy',
      href: '/produkty?gender=men&category=brasny',
      gender: 'men',
      isActive: true,
      displayOrder: 1,
      children: [
        {
          id: 'men-business-bags',
          name: 'Business tašky',
          slug: 'business-tasky',
          href: '/produkty?gender=men&category=brasny&subcategory=business-tasky',
          gender: 'men',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'men-laptop-bags',
          name: 'Tašky na notebook',
          slug: 'tasky-na-notebook',
          href: '/produkty?gender=men&category=brasny&subcategory=tasky-notebook',
          gender: 'men',
          isActive: true,
          displayOrder: 2
        },
        {
          id: 'men-backpacks',
          name: 'Batohy',
          slug: 'batohy',
          href: '/produkty?gender=men&category=brasny&subcategory=batohy',
          gender: 'men',
          isActive: true,
          displayOrder: 3
        },
        {
          id: 'men-travel-bags',
          name: 'Cestovní tašky',
          slug: 'cestovni-tasky',
          href: '/produkty?gender=men&category=brasny&subcategory=cestovni',
          gender: 'men',
          isActive: true,
          displayOrder: 4
        }
      ],
      features: [
        {
          id: 'leather',
          name: 'Kožené',
          slug: 'kozene',
          href: '/produkty?gender=men&features=kozene',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'waterproof',
          name: 'Vodotěsné',
          slug: 'vodotesne',
          href: '/produkty?gender=men&features=vodotesne',
          isActive: true,
          displayOrder: 2
        },
        {
          id: 'rfid',
          name: 'RFID ochrana',
          slug: 'rfid',
          href: '/produkty?gender=men&features=rfid',
          isActive: true,
          displayOrder: 3
        }
      ]
    },
    {
      id: 'men-wallets',
      name: 'Pánské peněženky',
      slug: 'panske-penezenky',
      href: '/produkty?gender=men&category=penezenky',
      gender: 'men',
      isActive: true,
      displayOrder: 2,
      children: [
        {
          id: 'men-leather-wallets',
          name: 'Kožené peněženky',
          slug: 'kozene-penezenky',
          href: '/produkty?gender=men&category=penezenky&material=koze',
          gender: 'men',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'men-card-holders',
          name: 'Pouzdra na karty',
          slug: 'pouzdra-na-karty',
          href: '/produkty?gender=men&category=penezenky&subcategory=pouzdra-karty',
          gender: 'men',
          isActive: true,
          displayOrder: 2
        },
        {
          id: 'men-money-clips',
          name: 'Spony na bankovky',
          slug: 'spony-bankovky',
          href: '/produkty?gender=men&category=penezenky&subcategory=spony',
          gender: 'men',
          isActive: true,
          displayOrder: 3
        }
      ],
      features: [
        {
          id: 'rfid-protection',
          name: 'RFID ochrana',
          slug: 'rfid',
          href: '/produkty?gender=men&category=penezenky&features=rfid',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'slim-design',
          name: 'Slim design',
          slug: 'slim',
          href: '/produkty?gender=men&category=penezenky&features=slim',
          isActive: true,
          displayOrder: 2
        }
      ]
    }
  ],
  women: [
    {
      id: 'women-bags',
      name: 'Dámské tašky a kabelky',
      slug: 'damske-tasky-kabelky',
      href: '/produkty?gender=women&category=brasny',
      gender: 'women',
      isActive: true,
      displayOrder: 1,
      children: [
        {
          id: 'women-handbags',
          name: 'Kabelky',
          slug: 'kabelky',
          href: '/produkty?gender=women&category=brasny&subcategory=kabelky',
          gender: 'women',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'women-crossbody',
          name: 'Crossbody tašky',
          slug: 'crossbody-tasky',
          href: '/produkty?gender=women&category=brasny&subcategory=crossbody-tasky',
          gender: 'women',
          isActive: true,
          displayOrder: 2
        },
        {
          id: 'women-shopping-bags',
          name: 'Nákupní tašky',
          slug: 'nakupni-tasky',
          href: '/produkty?gender=women&category=brasny&subcategory=nakupni-tasky',
          gender: 'women',
          isActive: true,
          displayOrder: 3
        },
        {
          id: 'women-organizers',
          name: 'Organizéry',
          slug: 'organizery',
          href: '/produkty?gender=women&category=brasny&subcategory=organizery',
          gender: 'women',
          isActive: true,
          displayOrder: 4
        }
      ],
      features: [
        {
          id: 'leather',
          name: 'Kožené',
          slug: 'kozene',
          href: '/produkty?gender=women&features=kozene',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'designer',
          name: 'Designové',
          slug: 'designove',
          href: '/produkty?gender=women&features=designove',
          isActive: true,
          displayOrder: 2
        }
      ]
    },
    {
      id: 'women-wallets',
      name: 'Dámské peněženky',
      slug: 'damske-penezenky',
      href: '/produkty?gender=women&category=penezenky',
      gender: 'women',
      isActive: true,
      displayOrder: 2,
      children: [
        {
          id: 'women-leather-wallets',
          name: 'Kožené peněženky',
          slug: 'kozene-penezenky',
          href: '/produkty?gender=women&category=penezenky&material=koze',
          gender: 'women',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'women-clutches',
          name: 'Psaníčka',
          slug: 'psanicka',
          href: '/produkty?gender=women&category=penezenky&subcategory=psanicka',
          gender: 'women',
          isActive: true,
          displayOrder: 2
        },
        {
          id: 'women-card-holders',
          name: 'Pouzdra na karty',
          slug: 'pouzdra-na-karty',
          href: '/produkty?gender=women&category=penezenky&subcategory=pouzdra-karty',
          gender: 'women',
          isActive: true,
          displayOrder: 3
        }
      ],
      features: [
        {
          id: 'rfid-protection',
          name: 'RFID ochrana',
          slug: 'rfid',
          href: '/produkty?gender=women&category=penezenky&features=rfid',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'compact',
          name: 'Kompaktní',
          slug: 'kompaktni',
          href: '/produkty?gender=women&category=penezenky&features=kompaktni',
          isActive: true,
          displayOrder: 2
        }
      ]
    }
  ],
  unisex: [
    {
      id: 'accessories',
      name: 'Doplňky',
      slug: 'doplnky',
      href: '/produkty?category=doplnky',
      gender: 'unisex',
      isActive: true,
      displayOrder: 1,
      children: [
        {
          id: 'keychains',
          name: 'Klíčenky',
          slug: 'klicenky',
          href: '/produkty?category=doplnky&subcategory=klicenky',
          gender: 'unisex',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'belts',
          name: 'Pásky',
          slug: 'pasky',
          href: '/produkty?category=doplnky&subcategory=pasky',
          gender: 'unisex',
          isActive: true,
          displayOrder: 2
        }
      ],
      features: []
    },
    {
      id: 'luggage',
      name: 'Kufry a cestovní zavazadla',
      slug: 'kufry-cestovni',
      href: '/produkty?category=kufry',
      gender: 'unisex',
      isActive: true,
      displayOrder: 2,
      children: [
        {
          id: 'hard-luggage',
          name: 'Tvrdé kufry',
          slug: 'tvrde-kufry',
          href: '/produkty?category=kufry&subcategory=tvrde',
          gender: 'unisex',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'soft-luggage',
          name: 'Měkké kufry',
          slug: 'mekke-kufry',
          href: '/produkty?category=kufry&subcategory=mekke',
          gender: 'unisex',
          isActive: true,
          displayOrder: 2
        },
        {
          id: 'travel-sets',
          name: 'Cestovní sety',
          slug: 'cestovni-sety',
          href: '/produkty?category=kufry&subcategory=sety',
          gender: 'unisex',
          isActive: true,
          displayOrder: 3
        }
      ],
      features: [
        {
          id: 'wheeled',
          name: 'S kolečky',
          slug: 's-kolecky',
          href: '/produkty?category=kufry&features=kolecka',
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'lightweight',
          name: 'Lehké',
          slug: 'lehke',
          href: '/produkty?category=kufry&features=lehke',
          isActive: true,
          displayOrder: 2
        }
      ]
    }
  ]
}