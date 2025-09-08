"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { 
  Package, 
  Search, 
  ArrowUpDown, 
  BarChart3, 
  Scan,
  Home,
  ChevronLeft
} from "lucide-react"

const WarehouseLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()

  const navigationItems = [
    {
      href: '/admin/sklad/dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Přehled skladového systému'
    },
    {
      href: '/admin/sklad/inventory',
      label: 'Inventář',
      icon: Search,
      description: 'Procházení a správa zásob'
    },
    {
      href: '/admin/sklad/movements',
      label: 'Pohyby',
      icon: ArrowUpDown,
      description: 'Historie pohybů zásob'
    },
    {
      href: '/admin/sklad/ocr',
      label: 'OCR Faktury',
      icon: Scan,
      description: 'Zpracování faktur pomocí OCR'
    },
    {
      href: '/admin/sklad/analytics',
      label: 'Analytika',
      icon: BarChart3,
      description: 'Analýza a reporty'
    },
    {
      href: '/admin/sklad/transfers',
      label: 'Převody',
      icon: Package,
      description: 'Převody mezi pobočkami'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/admin/sklad/dashboard') {
      return pathname === '/admin/sklad' || pathname === '/admin/sklad/dashboard'
    }
    return pathname.startsWith(href)
  }

  const currentPage = navigationItems.find(item => isActive(item.href))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm">Zpět do administrace</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Skladový systém</h1>
                  {currentPage && (
                    <p className="text-sm text-gray-600">{currentPage.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Online
            </Badge>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`h-12 px-4 rounded-none border-b-2 transition-all ${
                      active
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${active ? 'text-blue-600' : ''}`} />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export default WarehouseLayout