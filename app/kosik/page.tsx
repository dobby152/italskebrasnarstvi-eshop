import ShoppingCartSimple from '../components/shopping-cart-simple'
import Header from '../components/header'

export default function CartPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-8">
        <ShoppingCartSimple />
      </div>
    </div>
  )
}
