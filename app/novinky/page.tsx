import { Metadata } from 'next'
import { ProductGrid } from '../../components/product-grid'

export const metadata: Metadata = {
  title: 'Novinky | Italské Brašnářství',
  description: 'Nejnovější produkty v naší nabídce italských kožených výrobků'
}

export default function NovinkiPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Novinky</h1>
        <p className="text-gray-600">
          Objevte nejnovější přírůstky do naší kolekce italských kožených výrobků.
        </p>
      </div>
      
      <ProductGrid 
        sortBy="created_at"
        sortOrder="desc"
        limit={20}
      />
    </div>
  )
}