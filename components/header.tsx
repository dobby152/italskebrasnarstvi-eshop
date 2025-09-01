"use client"

import { Button } from "../app/components/ui/button"
import { Search, User, Heart, ShoppingCart, Menu, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useCart } from "../app/context/cart-context"
import { useAuth } from "../app/contexts/auth-context"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { totalItems } = useCart()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        {/* Top bar */}
        <div className="flex items-center justify-center py-2 text-sm text-gray-600 border-b border-gray-100">
          <div className="flex items-center space-x-6">
            <span>📞 +420 774 977 971</span>
            <span>🚚 Doprava zdarma nad 2.500 Kč</span>
            <span>🇨🇿 Český zákaznický servis</span>
            <span>💰 Garance nejlepší ceny</span>
          </div>
        </div>

        {/* Main navigation */}
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="text-2xl font-black tracking-tight">
            <span className="text-gray-900">italske</span>
            <span className="text-black">Brasnarstvi</span>
            <span className="text-gray-400 text-sm font-normal">.cz</span>
          </Link>

          {/* Simplified menu */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/produkty" className="text-gray-700 hover:text-black transition-colors font-medium">
              PRODUKTY
            </Link>
            <Link href="/kolekce" className="text-gray-700 hover:text-black transition-colors font-medium">
              KOLEKCE  
            </Link>
            <Link href="/o-nas" className="text-gray-700 hover:text-black transition-colors font-medium">
              O NÁS
            </Link>
            <Link href="/kontakt" className="text-gray-700 hover:text-black transition-colors font-medium">
              KONTAKT
            </Link>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Search icon */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </Button>

            {/* User account */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link href="/ucet">
                  <Button variant="ghost" size="sm" className="p-2">
                    <User className="h-5 w-5 text-gray-600" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-xs text-gray-600 hover:text-black"
                >
                  Odhlásit
                </Button>
              </div>
            ) : (
              <Link href="/prihlaseni">
                <Button variant="ghost" size="sm" className="p-2">
                  <User className="h-5 w-5 text-gray-600" />
                </Button>
              </Link>
            )}

            {/* Wishlist */}
            <Link href="/oblibene">
              <Button variant="ghost" size="sm" className="p-2">
                <Heart className="h-5 w-5 text-gray-600" />
              </Button>
            </Link>

            {/* Shopping cart */}
            <Link href="/kosik">
              <Button variant="ghost" size="sm" className="p-2 relative">
                <ShoppingCart className="h-5 w-5 text-gray-600" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Hledat produkty..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <Button className="absolute right-2 top-2 bg-black text-white px-4 py-1 rounded">
                Hledat
              </Button>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              <Link
                href="/produkty"
                className="block text-gray-700 hover:text-black transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                PRODUKTY
              </Link>
              <Link
                href="/kolekce"
                className="block text-gray-700 hover:text-black transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                KOLEKCE
              </Link>
              <Link
                href="/o-nas"
                className="block text-gray-700 hover:text-black transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                O NÁS
              </Link>
              <Link
                href="/kontakt"
                className="block text-gray-700 hover:text-black transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                KONTAKT
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}