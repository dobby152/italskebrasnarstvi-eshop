import { Metadata } from 'next'
import { ProductGrid } from '../../../components/product-grid'

export const metadata: Metadata = {
  title: 'Pánské | Italské Brašnářství',
  description: 'Stylové pánské kožené výrobky z Itálie'
}

export default function PanskePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Pánské</h1>
        <p className="text-gray-600">
          Objevte naši kolekci stylových pánských kožených výrobků z Itálie.
        </p>
      </div>
      
      <ProductGrid 
        category="panske"
        sortBy="name"
        sortOrder="asc"
        limit={20}
      />
    </div>
  )
}