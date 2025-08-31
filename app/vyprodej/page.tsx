import { Metadata } from 'next'
import { ProductGrid } from '../../components/product-grid'

export const metadata: Metadata = {
  title: 'Výprodej | Italské Brašnářství',
  description: 'Výhodné nabídky a slevy na italské kožené výrobky'
}

export default function VyprodejPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Výprodej</h1>
        <p className="text-gray-600">
          Využijte výhodné nabídky na vybrané italské kožené výrobky.
        </p>
      </div>
      
      <ProductGrid 
        sortBy="price"
        sortOrder="asc"
        limit={20}
      />
    </div>
  )
}