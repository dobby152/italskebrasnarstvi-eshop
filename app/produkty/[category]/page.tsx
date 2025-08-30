import ProductGrid from '../../components/product-grid'

interface CategoryPageProps {
  params: Promise<{
    category: string
  }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 capitalize">
        {category.replace('-', ' ')}
      </h1>
      <ProductGrid category={category} />
    </div>
  )
}