"use client"

import React from "react"
import Link from "next/link"
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Tag, 
  Grid3X3,
  ArrowLeft,
  Store,
  TrendingUp,
  Percent,
  Puzzle,
  Menu
} from "lucide-react"

const navigationItems = [
  { href: "/admin", label: "Domů", icon: Home },
  { href: "/admin/produkty", label: "Produkty", icon: Package },
  { href: "/admin/objednavky", label: "Objednávky", icon: ShoppingCart },
  { href: "/admin/zakaznici", label: "Zákazníci", icon: Users },
  { href: "/admin/analytika", label: "Analytika", icon: BarChart3 },
  { href: "/admin/slevy", label: "Slevy", icon: Percent },
  { href: "/admin/aplikace", label: "Aplikace", icon: Puzzle },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-xl border-r border-gray-800 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Italské Brašnářství</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 space-y-1">
          {navigationItems?.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 group"
              >
                <Icon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
          
          {/* Separator */}
          <div className="border-t border-gray-800 my-4"></div>
          
          {/* Back to Store */}
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 group"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
            <span className="font-medium">Zpět do eshopu</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          <div className="w-10" />
        </div>
        
        <div className="overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
