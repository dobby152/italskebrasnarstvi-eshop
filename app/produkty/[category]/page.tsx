import ProductGrid from '../components/product-grid'

interface CategoryPageProps {
  params: {
    category: string
  }
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 capitalize">
        {params.category.replace('-', ' ')}
      </h1>
      <ProductGrid category={params.category} />
    </div>
  )
}