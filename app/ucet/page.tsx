"use client"

import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { User, Package, Heart, Settings, LogOut, Edit, Save, X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "../components/header"
import { useAuth } from "../contexts/auth-context"

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profil")
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [orders, setOrders] = useState([])
  
  const { user, isAuthenticated, updateProfile, logout, loading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/prihlaseni')
    }
  }, [isAuthenticated, authLoading, router])

  // Fetch user orders
  useEffect(() => {
    if (isAuthenticated && activeTab === 'objednavky') {
      fetchOrders()
    }
  }, [isAuthenticated, activeTab])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('http://localhost:3001/api/user/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const ordersData = await response.json()
        setOrders(ordersData)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const [userInfo, setUserInfo] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    birthDate: "",
    address: {
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      postalCode: user?.address?.postalCode || "",
      country: user?.address?.country || "",
    },
  })

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setUserInfo({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        birthDate: "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          postalCode: user.address?.postalCode || "",
          country: user.address?.country || "",
        },
      })
    }
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }


  const handleSave = async () => {
    setError("")
    setLoading(true)
    
    try {
      const result = await updateProfile({
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        phone: userInfo.phone,
        address: userInfo.address
      })
      
      if (result.success) {
        setIsEditing(false)
      } else {
        setError(result.error || 'Aktualizace se nezdařila')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data if needed
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Můj účet</h1>
          <p className="text-xl text-gray-600">Spravujte své objednávky, profil a nastavení</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-6 shadow-lg border-0">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {user?.firstName || 'Uživatel'} {user?.lastName || ''}
                  </h3>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {[
                  { id: "profil", label: "Můj profil", icon: User },
                  { id: "objednavky", label: "Moje objednávky", icon: Package },
                  { id: "oblibene", label: "Oblíbené produkty", icon: Heart },
                  { id: "nastaveni", label: "Nastavení", icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === item.id ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100 hover:text-black"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Odhlásit se
                </button>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "profil" && (
              <Card className="p-8 shadow-lg border-0">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900">Můj profil</h2>
                    {error && (
                      <div className="mt-2 text-sm text-red-600">{error}</div>
                    )}
                  </div>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="border-gray-300 hover:border-black"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Upravit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={loading} className="bg-black hover:bg-gray-800">
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {loading ? "Ukládání..." : "Uložit"}
                      </Button>
                      <Button onClick={handleCancel} variant="outline">
                        <X className="h-4 w-4 mr-2" />
                        Zrušit
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Osobní údaje</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-2 block">
                          Jméno
                        </Label>
                        <Input
                          id="firstName"
                          value={userInfo.firstName}
                          onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                          disabled={!isEditing}
                          className="border-gray-300 focus:border-black"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-2 block">
                          Příjmení
                        </Label>
                        <Input
                          id="lastName"
                          value={userInfo.lastName}
                          onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                          disabled={!isEditing}
                          className="border-gray-300 focus:border-black"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                        disabled={!isEditing}
                        className="border-gray-300 focus:border-black"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                        Telefon
                      </Label>
                      <Input
                        id="phone"
                        value={userInfo.phone}
                        onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                        disabled={!isEditing}
                        className="border-gray-300 focus:border-black"
                      />
                    </div>

                    <div>
                      <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700 mb-2 block">
                        Datum narození
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={userInfo.birthDate}
                        onChange={(e) => setUserInfo({ ...userInfo, birthDate: e.target.value })}
                        disabled={!isEditing}
                        className="border-gray-300 focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Adresa</h3>

                    <div>
                      <Label htmlFor="street" className="text-sm font-medium text-gray-700 mb-2 block">
                        Ulice a číslo popisné
                      </Label>
                      <Input
                        id="street"
                        value={userInfo.address.street}
                        onChange={(e) =>
                          setUserInfo({
                            ...userInfo,
                            address: { ...userInfo.address, street: e.target.value },
                          })
                        }
                        disabled={!isEditing}
                        className="border-gray-300 focus:border-black"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
                          Město
                        </Label>
                        <Input
                          id="city"
                          value={userInfo.address.city}
                          onChange={(e) =>
                            setUserInfo({
                              ...userInfo,
                              address: { ...userInfo.address, city: e.target.value },
                            })
                          }
                          disabled={!isEditing}
                          className="border-gray-300 focus:border-black"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700 mb-2 block">
                          PSČ
                        </Label>
                        <Input
                          id="postalCode"
                          value={userInfo.address.postalCode}
                          onChange={(e) =>
                            setUserInfo({
                              ...userInfo,
                              address: { ...userInfo.address, postalCode: e.target.value },
                            })
                          }
                          disabled={!isEditing}
                          className="border-gray-300 focus:border-black"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700 mb-2 block">
                        Země
                      </Label>
                      <Input
                        id="country"
                        value={userInfo.address.country}
                        onChange={(e) =>
                          setUserInfo({
                            ...userInfo,
                            address: { ...userInfo.address, country: e.target.value },
                          })
                        }
                        disabled={!isEditing}
                        className="border-gray-300 focus:border-black"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "objednavky" && (
              <Card className="p-8 shadow-lg border-0">
                <h2 className="text-3xl font-black text-gray-900 mb-8">Moje objednávky</h2>

                <div className="space-y-6">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-6 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Objednávka #{order.id}</h3>
                          <p className="text-gray-600">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <div
                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              order.status === "Doručeno"
                                ? "bg-green-100 text-green-800"
                                : order.status === "Zpracovává se"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </div>
                          <div className="text-xl font-bold text-gray-900 mt-2">{order.total}</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <img
                              src={`/placeholder.svg?height=80&width=80&query=${item.image}`}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{item.name}</h4>
                              <p className="text-gray-600">Množství: {item.quantity}</p>
                            </div>
                            <div className="text-lg font-bold text-gray-900">{item.price}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <Button variant="outline" className="border-gray-300 hover:border-black bg-transparent">
                          Zobrazit detail
                        </Button>
                        {order.status === "Doručeno" && (
                          <Button variant="outline" className="border-gray-300 hover:border-black bg-transparent">
                            Koupit znovu
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "oblibene" && (
              <Card className="p-8 shadow-lg border-0">
                <h2 className="text-3xl font-black text-gray-900 mb-8">Oblíbené produkty</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      name: 'Batoh na počítač 14" s kapsou na AirPods®',
                      brand: "Piquadro",
                      price: "7.675 Kč",
                      originalPrice: "9.595 Kč",
                      image: "mustard yellow laptop backpack with AirPods pocket modern design",
                      inStock: true,
                    },
                    {
                      name: "Cross-body taška přes rameno pro iPad/iPad®Air",
                      brand: "Piquadro",
                      price: "4.945 Kč",
                      originalPrice: "5.495 Kč",
                      image: "mint green crossbody bag for iPad modern design",
                      inStock: true,
                    },
                    {
                      name: 'Taška na počítač 15" a iPad® Pro 12,9"',
                      brand: "Piquadro",
                      price: "12.720 Kč",
                      originalPrice: "13.270 Kč",
                      image: "black laptop bag for 15 inch and iPad Pro modern design",
                      inStock: false,
                    },
                  ].map((product, index) => (
                    <Card key={index} className="group border border-gray-200 shadow-sm overflow-hidden">
                      <div className="relative">
                        <img
                          src={`/placeholder.svg?height=200&width=300&query=${product.image}`}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-3 right-3 bg-white/90 hover:bg-white shadow-lg"
                        >
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </Button>
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold">Není skladem</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
                        <h3 className="font-semibold mb-3 line-clamp-2">{product.name}</h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-gray-900">{product.price}</span>
                            {product.originalPrice && (
                              <div className="text-sm text-gray-500 line-through">{product.originalPrice}</div>
                            )}
                          </div>
                          <Button className="bg-black hover:bg-gray-800 text-white" disabled={!product.inStock}>
                            {product.inStock ? "Do košíku" : "Není skladem"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "nastaveni" && (
              <Card className="p-8 shadow-lg border-0">
                <h2 className="text-3xl font-black text-gray-900 mb-8">Nastavení</h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Oznámení</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">E-mailové novinky</h4>
                          <p className="text-gray-600 text-sm">Dostávejte informace o nových produktech a slevách</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                      </div>
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">SMS oznámení</h4>
                          <p className="text-gray-600 text-sm">Dostávejte SMS o stavu objednávky</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                      </div>
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">Marketingové e-maily</h4>
                          <p className="text-gray-600 text-sm">Personalizované nabídky a doporučení</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Bezpečnost</h3>
                    <div className="space-y-4">
                      <Button variant="outline" className="border-gray-300 hover:border-black bg-transparent">
                        Změnit heslo
                      </Button>
                      <Button variant="outline" className="border-gray-300 hover:border-black bg-transparent">
                        Dvoufaktorové ověření
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Účet</h3>
                    <div className="space-y-4">
                      <Button variant="outline" className="border-gray-300 hover:border-black bg-transparent">
                        Stáhnout moje data
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-600 hover:border-red-500 bg-transparent"
                      >
                        Smazat účet
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
