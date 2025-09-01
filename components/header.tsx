"use client"

import { Button } from "../app/components/ui/button"
import { Search, User, Heart, ShoppingCart, Menu, X, ChevronDown, LogOut } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { STATIC_CATEGORIES, NavigationCategory } from "../app/lib/types"
import { useCart } from "../app/context/cart-context"
import { useAuth } from "../app/contexts/auth-context"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const headerRef = useRef<HTMLElement>(null)
  const { totalItems } = useCart()
  const { user, isAuthenticated, logout } = useAuth()

  // Zavřít dropdown při kliknutí mimo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setDropdownOpen(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav ref={headerRef} className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
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
              {dropdownOpen === 'men' && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      {STATIC_CATEGORIES?.men?.map((category) => (
                        <div key={category.id} className="space-y-3">
                          <Link 
                            href={category.href} 
                            className="block text-sm font-semibold text-gray-900 hover:text-black transition-colors"
                            onClick={() => setDropdownOpen(null)}
                          >
                            {category.name}
                          </Link>
                          <div className="space-y-2">
                            {category.children?.map((subcategory) => (
                              <Link
                                key={subcategory.id}
                                href={subcategory.href}
                                className="block text-xs text-gray-600 hover:text-black transition-colors pl-2"
                                onClick={() => setDropdownOpen(null)}
                              >
                                {subcategory.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-2">Vlastnosti:</div>
                      <div className="flex flex-wrap gap-2">
                        {STATIC_CATEGORIES.men.flatMap(cat => cat.features || []).map((feature) => (
                          <Link
                            key={feature.id}
                            href={feature.href}
                            className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
                            onClick={() => setDropdownOpen(null)}
                          >
                            {feature.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DÁMSKÉ dropdown */}
            <div className="relative group">
              <button
                className="flex items-center text-gray-700 hover:text-black transition-colors font-medium"
                onClick={() => setDropdownOpen(dropdownOpen === 'women' ? null : 'women')}
              >
                DÁMSKÉ
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {dropdownOpen === 'women' && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      {STATIC_CATEGORIES?.women?.map((category) => (
                        <div key={category.id} className="space-y-3">
                          <Link 
                            href={category.href} 
                            className="block text-sm font-semibold text-gray-900 hover:text-black transition-colors"
                            onClick={() => setDropdownOpen(null)}
                          >
                            {category.name}
                          </Link>
                          <div className="space-y-2">
                            {category.children?.map((subcategory) => (
                              <Link
                                key={subcategory.id}
                                href={subcategory.href}
                                className="block text-xs text-gray-600 hover:text-black transition-colors pl-2"
                                onClick={() => setDropdownOpen(null)}
                              >
                                {subcategory.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-2">Vlastnosti:</div>
                      <div className="flex flex-wrap gap-2">
                        {STATIC_CATEGORIES.women.flatMap(cat => cat.features || []).map((feature) => (
                          <Link
                            key={feature.id}
                            href={feature.href}
                            className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
                            onClick={() => setDropdownOpen(null)}
                          >
                            {feature.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Business dropdown */}
            <div className="relative group">
              <button
                className="flex items-center text-gray-700 hover:text-black transition-colors font-medium"
                onClick={() => setDropdownOpen(dropdownOpen === 'business' ? null : 'business')}
              >
                Business
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {dropdownOpen === 'business' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <Link href="/kategorie/aktoky" className="block py-2 text-sm text-gray-600 hover:text-black transition-colors">Aktovky</Link>
                    <Link href="/kategorie/notebook-tasky" className="block py-2 text-sm text-gray-600 hover:text-black transition-colors">Notebook tašky</Link>
                    <Link href="/kategorie/business-batohy" className="block py-2 text-sm text-gray-600 hover:text-black transition-colors">Business batohy</Link>
                    <Link href="/kategorie/messenger" className="block py-2 text-sm text-gray-600 hover:text-black transition-colors">Messenger tašky</Link>
                    <Link href="/kategorie/organizery" className="block py-2 text-sm text-gray-600 hover:text-black transition-colors">Organizéry</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Cestování dropdown */}
            <div className="relative group">
              <button
                className="flex items-center text-gray-700 hover:text-black transition-colors font-medium"
                onClick={() => setDropdownOpen(dropdownOpen === 'travel' ? null : 'travel')}
              >
                Cestování
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {dropdownOpen === 'travel' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <Link href="/kategorie/kufry" className="block py-2 text-sm text-gray-600 hover:text-black transition-colors">Kufry a trolley</Link>
                    <Link href="/kategorie/cestovni-tasky" className="block py-2 text-sm text-gray-600 hover:text-black transition-colors">Cestovní tašky</Link>
                    <Link href="/kategorie/cestovni-batohy" className="block py-2 text-sm text-gray-600 hover:text-black transition-colors">Cestovní batohy</Link>
                    <Link href="/kategorie/kosmeticke-tasky" className="block py-2 text-sm text-gray-600 hover:text-black transition-colors">Kosmetické tašky</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Ostatní kategorie */}
            {STATIC_CATEGORIES.unisex.map((category) => (
              <div key={category.id} className="relative group">
                <button
                  className="flex items-center text-gray-700 hover:text-black transition-colors font-medium"
                  onClick={() => setDropdownOpen(dropdownOpen === category.id ? null : category.id)}
                >
                  {category.name}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {dropdownOpen === category.id && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <Link 
                        href={category.href} 
                        className="block text-sm font-medium text-gray-900 hover:text-black mb-3 transition-colors"
                        onClick={() => setDropdownOpen(null)}
                      >
                        Vše v kategorii
                      </Link>
                      <div className="space-y-2">
                        {category.children?.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={subcategory.href}
                            className="block text-sm text-gray-600 hover:text-black transition-colors"
                            onClick={() => setDropdownOpen(null)}
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                      {category.features && category.features.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="flex flex-wrap gap-2">
                            {category.features?.map((feature) => (
                              <Link
                                key={feature.id}
                                href={feature.href}
                                className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
                                onClick={() => setDropdownOpen(null)}
                              >
                                {feature.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Link href="/novinky" className="text-gray-700 hover:text-black transition-colors font-medium">
              Novinky
            </Link>
            <Link href="/vyprodej" className="text-red-600 hover:text-red-700 transition-colors font-medium">
              Výprodej
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="h-5 w-5 text-gray-600 hover:text-black transition-colors" />
            </button>
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <User className="h-5 w-5 text-gray-600 hover:text-black transition-colors" />
                  {user?.firstName && (
                    <span className="ml-1 text-sm text-gray-600 hidden md:block">
                      {user.firstName}
                    </span>
                  )}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden group-hover:block">
                  <div className="p-2">
                    <Link 
                      href="/ucet" 
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      Můj účet
                    </Link>
                    {user?.role === 'admin' && (
                      <Link 
                        href="/admin" 
                        className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        Admin panel
                      </Link>
                    )}
                    <button 
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Odhlásit se
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/prihlaseni" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <User className="h-5 w-5 text-gray-600 hover:text-black transition-colors" />
              </Link>
            )}
            <Link href="/oblibene" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Heart className="h-5 w-5 text-gray-600 hover:text-black transition-colors" />
            </Link>
            <Link href="/kosik" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="h-5 w-5 text-gray-600 hover:text-black transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Hledat produkty..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                autoFocus
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black hover:bg-gray-800">
                Hledat
              </Button>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4">
            <div className="space-y-4">
              {/* PÁNSKÉ section */}
              <div className="space-y-2">
                <div className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                  PÁNSKÉ
                </div>
                <div className="pl-4 space-y-3">
                  {STATIC_CATEGORIES?.men?.map((category) => (
                    <div key={category.id}>
                      <Link 
                        href={category.href} 
                        className="block text-sm font-medium text-gray-700 hover:text-black transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                      <div className="pl-3 mt-1 space-y-1">
                        {category.children?.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={subcategory.href}
                            className="block text-xs text-gray-600 hover:text-black transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DÁMSKÉ section */}
              <div className="space-y-2">
                <div className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                  DÁMSKÉ
                </div>
                <div className="pl-4 space-y-3">
                  {STATIC_CATEGORIES?.women?.map((category) => (
                    <div key={category.id}>
                      <Link 
                        href={category.href} 
                        className="block text-sm font-medium text-gray-700 hover:text-black transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                      <div className="pl-3 mt-1 space-y-1">
                        {category.children?.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={subcategory.href}
                            className="block text-xs text-gray-600 hover:text-black transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ostatní kategorie */}
              {STATIC_CATEGORIES.unisex.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                    {category.name}
                  </div>
                  <div className="pl-4 space-y-2">
                    <Link 
                      href={category.href} 
                      className="block text-sm text-gray-600 hover:text-black transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Vše v kategorii
                    </Link>
                    {category.children?.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={subcategory.href}
                        className="block text-sm text-gray-600 hover:text-black transition-colors pl-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Business section */}
              <div className="space-y-2">
                <div className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Business
                </div>
                <div className="pl-4 space-y-2">
                  <Link href="/kategorie/aktoky" className="block text-sm text-gray-600 hover:text-black transition-colors">Aktovky</Link>
                  <Link href="/kategorie/notebook-tasky" className="block text-sm text-gray-600 hover:text-black transition-colors">Notebook tašky</Link>
                  <Link href="/kategorie/business-batohy" className="block text-sm text-gray-600 hover:text-black transition-colors">Business batohy</Link>
                  <Link href="/kategorie/messenger" className="block text-sm text-gray-600 hover:text-black transition-colors">Messenger tašky</Link>
                </div>
              </div>

              {/* Cestování section */}
              <div className="space-y-2">
                <div className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Cestování
                </div>
                <div className="pl-4 space-y-2">
                  <Link href="/kategorie/kufry" className="block text-sm text-gray-600 hover:text-black transition-colors">Kufry a trolley</Link>
                  <Link href="/kategorie/cestovni-tasky" className="block text-sm text-gray-600 hover:text-black transition-colors">Cestovní tašky</Link>
                  <Link href="/kategorie/cestovni-batohy" className="block text-sm text-gray-600 hover:text-black transition-colors">Cestovní batohy</Link>
                  <Link href="/kategorie/kosmeticke-tasky" className="block text-sm text-gray-600 hover:text-black transition-colors">Kosmetické tašky</Link>
                </div>
              </div>

              {/* Novinky a Výprodej */}
              <div className="space-y-2">
                <Link href="/novinky" className="block text-black hover:text-gray-700 transition-colors font-semibold">Novinky</Link>
                <Link href="/vyprodej" className="block text-red-600 hover:text-red-700 transition-colors font-semibold">Výprodej</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
