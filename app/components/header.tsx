"use client"

import { Button } from "./ui/button"
import { Search, User, Heart, ShoppingCart, Menu, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "../context/cart-context"
import { useAuth } from "../contexts/auth-context"
import { getAvailableCategories } from "../lib/product-categories"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const productCategories = getAvailableCategories()
  
  // Safe cart usage
  let totalItems = 0
  try {
    const cart = useCart()
    totalItems = cart?.totalItems || 0
  } catch (error) {
    totalItems = 0
  }
  
  // Safe auth usage
  let user = null
  let isAuthenticated = false
  let logout = () => {}
  try {
    const auth = useAuth()
    user = auth?.user || null
    isAuthenticated = auth?.isAuthenticated || false
    logout = auth?.logout || (() => {})
  } catch (error) {
    // Auth provider not available
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/produkty?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Compact top bar */}
        <div className="hidden md:flex items-center justify-center py-1 text-xs text-gray-600 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <span>📞 +420 774 977 971</span>
            <span>🚚 Doprava zdarma nad 2.500 Kč</span>
          </div>
        </div>

        {/* Main navigation */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="text-xl font-normal tracking-tight">
            <span className="text-black font-normal">italske</span>
            <span className="text-black font-bold">Brasnarstvi</span>
            <span className="text-black font-normal">.cz</span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {productCategories.map((category) => (
              <Link 
                key={category.id}
                href={`/produkty?productType=${category.id}`} 
                className="text-xs font-bold text-gray-700 hover:text-black transition-colors uppercase whitespace-nowrap px-1"
              >
                {category.name.toUpperCase()}
              </Link>
            ))}
            <Link href="/produkty" className="text-xs font-bold text-gray-700 hover:text-black transition-colors whitespace-nowrap px-1">
              VŠECHNY PRODUKTY
            </Link>
          </div>

          {/* Right side icons */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Search */}
            {!searchOpen ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="text-gray-700 hover:text-black p-2"
              >
                <Search className="h-5 w-5" />
              </Button>
            ) : (
              <div className="relative">
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    placeholder="Hledat produkty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent w-64"
                    autoFocus
                  />
                  <Button type="submit" variant="default" size="sm" className="rounded-l-none px-4">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchQuery("")
                    }}
                    className="ml-2 text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Ahoj, {user?.email || 'uživateli'}!</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-gray-700 hover:text-black"
                >
                  Odhlásit
                </Button>
              </div>
            ) : (
              <Link href="/prihlaseni">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-black p-2">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/kosik">
              <Button variant="ghost" size="sm" className="text-gray-700 hover:text-black p-2 relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-700 hover:text-black p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Hledat produkty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <Button type="submit" variant="default" size="sm" className="rounded-l-none">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Mobile navigation */}
              <div className="space-y-2">
                {productCategories.map((category) => (
                  <Link 
                    key={category.id}
                    href={`/produkty?productType=${category.id}`} 
                    className="block py-3 text-lg font-bold text-gray-700 hover:text-black uppercase"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name.toUpperCase()}
                  </Link>
                ))}
                <Link 
                  href="/produkty" 
                  className="block py-3 text-lg font-bold text-gray-700 hover:text-black uppercase"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  VŠECHNY PRODUKTY
                </Link>
                <Link 
                  href="/kosik" 
                  className="block py-2 text-gray-700 hover:text-black font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Košík ({totalItems})
                </Link>
                {!isAuthenticated ? (
                  <Link 
                    href="/prihlaseni" 
                    className="block py-2 text-gray-700 hover:text-black font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Přihlášení
                  </Link>
                ) : (
                  <button 
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="block py-2 text-gray-700 hover:text-black font-medium text-left w-full"
                  >
                    Odhlásit se
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}