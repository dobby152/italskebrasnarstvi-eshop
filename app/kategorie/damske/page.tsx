import { Metadata } from 'next'
import { ProductGrid } from '../../../components/product-grid'

export const metadata: Metadata = {
  title: 'Dámské | Italské Brašnářství',
  description: 'Elegantní dámské kožené výrobky z Itálie'
}

export default function DamskePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Dámské</h1>
        <p className="text-gray-600">
          Objevte naši kolekci elegantních dámských kožených výrobků z Itálie.
        </p>
      </div>
      
      <ProductGrid 
        category="damske"
        sortBy="name"
        sortOrder="asc"
        limit={20}
      />
    </div>
  )
}