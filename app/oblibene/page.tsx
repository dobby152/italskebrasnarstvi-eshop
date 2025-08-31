"use client"

// Disable static generation for favorites page since it may use auth context
export const dynamic = 'force-dynamic'

import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Heart, ShoppingCart, Star, Trash2, Filter } from "lucide-react"
import { useState } from "react"
import Header from "../components/header"
import Link from "next/link"
import { createProductSlug } from "../lib/utils"

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      name: 'Batoh na počítač 14" s kapsou na AirPods®',
      brand: "Piquadro",
      price: "7.675 Kč",
      originalPrice: "9.595 Kč",
      savings: "1.920 Kč",
      image: "mustard yellow laptop backpack with AirPods pocket modern design",
      colors: ["#6b7280", "#2d2d2d", "#9ca3af"],
      
      inStock: true,
      category: "Batohy",
      dateAdded: "15. ledna 2025",
    },
    {
      id: 2,
      name: "Cross-body taška přes rameno pro iPad/iPad®Air",
      brand: "Piquadro",
      price: "4.945 Kč",
      originalPrice: "5.495 Kč",
      savings: "550 Kč",
      image: "mint green crossbody bag for iPad modern design",
      colors: ["#9ca3af", "#2d2d2d", "#6b7280"],
      
      inStock: true,
      category: "Tašky",
      dateAdded: "12. ledna 2025",
    },
    {
      id: 3,
      name: 'Taška na počítač 15" a iPad® Pro 12,9"',
      brand: "Piquadro",
      price: "12.720 Kč",
      originalPrice: "13.270 Kč",
      savings: "550 Kč",
      image: "black laptop bag for 15 inch and iPad Pro modern design",
      colors: ["#2d2d2d", "#6b7280", "#4a5568"],
      
      inStock: false,
      category: "Tašky",
      dateAdded: "8. ledna 2025",
    },
    {
      id: 4,
      name: "Kožená peněženka s RFID ochranou",
      brand: "Piquadro",
      price: "2.890 Kč",
      originalPrice: "3.290 Kč",
      savings: "400 Kč",
      image: "black leather wallet with RFID protection elegant design",
      colors: ["#2d2d2d", "#8b4513", "#654321"],
      
      inStock: true,
      category: "Peněženky",
      dateAdded: "5. ledna 2025",
    },
    {
      id: 5,
      name: "Cestovní kufr s TSA zámkem",
      brand: "Piquadro",
      price: "15.990 Kč",
      originalPrice: "18.990 Kč",
      savings: "3.000 Kč",
      image: "premium travel suitcase with TSA lock modern design",
      colors: ["#2d2d2d", "#6b7280", "#1f2937"],
      
      inStock: true,
      category: "Kufry",
      dateAdded: "2. ledna 2025",
    },
  ])

  const [selectedCategory, setSelectedCategory] = useState("Vše")
  const [sortBy, setSortBy] = useState("dateAdded")

  const categories = ["Vše", "Batohy", "Tašky", "Peněženky", "Kufry"]

  const removeFavorite = (id: number) => {
    setFavorites(favorites.filter((item) => item.id !== id))
  }

  const filteredFavorites = favorites.filter((item) => selectedCategory === "Vše" || item.category === selectedCategory)

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return Number.parseInt(a.price.replace(/[^\d]/g, "")) - Number.parseInt(b.price.replace(/[^\d]/g, ""))
      case "name":
        return a.name.localeCompare(b.name)
      case "dateAdded":
      default:
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    }
  })

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Oblíbené produkty</h1>
          <p className="text-xl text-gray-600">
            Máte uloženo {favorites.length}{" "}
            {favorites.length === 1 ? "produkt" : favorites.length < 5 ? "produkty" : "produktů"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-8" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Zatím nemáte žádné oblíbené produkty</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Začněte procházet naši nabídku a přidávejte produkty do oblíbených kliknutím na ikonu srdce
            </p>
            <Link href="/produkty">
              <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-semibold">
                Prohlédnout produkty
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Filters and Sorting */}
            <div className="flex flex-col md:flex-row gap-6 mb-12">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Kategorie:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:w-64">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Seřadit podle:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="dateAdded">Datum přidání</option>
                  <option value="name">Název A-Z</option>
                  <option value="price">Cena (nejlevnější)</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedFavorites.map((product) => (
                <Card
                  key={product.id}
                  className="group bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={`/placeholder.svg?height=300&width=300&query=${product.image}`}
                      alt={product.name}
                      className="w-full h-[300px] object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Favorite and Remove buttons */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFavorite(product.id)}
                        className="bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all"
                        title="Odebrat z oblíbených"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button size="icon" variant="ghost" className="bg-white/90 hover:bg-white shadow-lg">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </Button>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.savings && (
                        <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          Ušetřete {product.savings}
                        </div>
                      )}
                      {!product.inStock && (
                        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          Není skladem
                        </div>
                      )}
                    </div>

                    {/* Category and Date Added */}
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                        {product.category} • {product.dateAdded}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">


                    {/* Brand and Name */}
                    <p className="text-sm text-gray-500 mb-2 font-medium">{product.brand}</p>
                    <h3 className="font-bold text-lg mb-4 line-clamp-2 text-gray-900 leading-tight">{product.name}</h3>

                    {/* Colors */}
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-sm text-gray-600 mr-2">Barvy:</span>
                      {product.colors.map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-gray-900">{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/produkt/${createProductSlug(product)}`}>
                          <Button variant="outline" className="border-gray-300 hover:border-black bg-transparent">
                            Zobrazit
                          </Button>
                        </Link>
                        <Button
                          className="bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          disabled={!product.inStock}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {product.inStock ? "Koupit" : "Není skladem"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-16 bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Souhrn oblíbených</h3>
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-black text-gray-900 mb-2">{favorites.length}</div>
                  <div className="text-gray-600">Celkem produktů</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900 mb-2">
                    {favorites.filter((item) => item.inStock).length}
                  </div>
                  <div className="text-gray-600">Skladem</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900 mb-2">
                    4.7
                  </div>
                  <div className="text-gray-600">Průměrné hodnocení</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900 mb-2">
                    {favorites
                      .reduce(
                        (sum, item) => sum + (item.savings ? Number.parseInt(item.savings.replace(/[^\d]/g, "")) : 0),
                        0,
                      )
                      .toLocaleString()}{" "}
                    Kč
                  </div>
                  <div className="text-gray-600">Celkové úspory</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-12 text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    const inStockItems = favorites.filter((item) => item.inStock)
                    if (inStockItems.length > 0) {
                      // Add all in-stock items to cart
                      alert(`Přidáno ${inStockItems.length} produktů do košíku`)
                    }
                  }}
                  className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-semibold"
                  disabled={favorites.filter((item) => item.inStock).length === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Přidat vše do košíku ({favorites.filter((item) => item.inStock).length})
                </Button>
                <Button
                  onClick={() => setFavorites([])}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:border-red-500 hover:bg-red-50 px-8 py-3 text-lg font-semibold"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Vymazat vše
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
