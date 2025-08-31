"use client"

// Disable static generation for home page since it uses header with context providers
export const dynamic = 'force-dynamic'

import React from "react"
import { Button } from "./components/ui/button"
import { useState, lazy, Suspense, useEffect } from "react"
import dynamic from 'next/dynamic'

// Dynamically import Header to prevent SSR issues
const Header = dynamic(() => import("./components/header"), { ssr: false })
import { Star } from "lucide-react"
import Link from "next/link"
import ProductSection from "./components/product-section"

const SustainabilitySection = lazy(() => import("./components/sustainability-section"))
const CollectionsSection = lazy(() => import("./components/collections-section"))
const BrandStorySection = lazy(() => import("./components/brand-story-section"))

export default function HomePage() {
  const [sustainabilityExpanded, setSustainabilityExpanded] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative h-[80vh] min-h-[600px] bg-gradient-to-r from-gray-900 to-black overflow-hidden">
        {/* Video pozadí */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/0dc6d1a2966a4e3f9c679ea47cf6dd7c.SD-480p-1.5Mbps-21883001.mp4" type="video/mp4" />
        </video>
        
        {/* Tmavý overlay pro lepší čitelnost textu */}
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 container mx-auto px-6 h-full flex items-center">
          <div className="max-w-2xl">
            <div className="mb-6">
              <span className="inline-block bg-white text-black px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                Oficiální český distributor
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-2xl">PIQUADRO</h1>
            <p className="text-white/95 text-lg mb-8 leading-relaxed max-w-xl drop-shadow-lg">
              Italské řemeslné umění. Moderní design. Nekompromisní kvalita.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-3 font-semibold text-base shadow-xl">
                Nakupovat nyní
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 bg-transparent text-base shadow-xl"
              >
                Naše prodejny
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Muži a Ženy sekce */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Muži */}
            <Link href="/produkty?kategorie=panske" className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative h-96">
                <img 
                  src="/muzi.webp" 
                  alt="Pánské produkty" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h3 className="text-4xl font-bold mb-2 drop-shadow-lg">MUŽI</h3>
                    <p className="text-lg drop-shadow-md">Objevte pánskou kolekci</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Ženy */}
            <Link href="/produkty?kategorie=damske" className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative h-96">
                <img 
                  src="/zeny.webp" 
                  alt="Dámské produkty" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h3 className="text-4xl font-bold mb-2 drop-shadow-lg">ŽENY</h3>
                    <p className="text-lg drop-shadow-md">Objevte dámskou kolekci</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Kategorie podle Piquadro */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Objevte naše kategorie</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Od business aktovek po cestovní kufry - najděte perfektní doplněk pro každou příležitost
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Pánské */}
            <Link href="/kategorie/panske" className="group">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="h-64 bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-4">💼</div>
                    <h3 className="text-2xl font-bold">Pánské</h3>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Pro muže</h4>
                  <p className="text-gray-600 text-sm mb-4">Aktovky, business tašky, pánské batohy a peněženky</p>
                  <div className="text-black font-medium group-hover:text-gray-600 transition-colors">
                    Prohlédnout →
                  </div>
                </div>
              </div>
            </Link>

            {/* Dámské */}
            <Link href="/kategorie/damske" className="group">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="h-64 bg-gradient-to-br from-pink-900 to-pink-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-4">👜</div>
                    <h3 className="text-2xl font-bold">Dámské</h3>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Pro ženy</h4>
                  <p className="text-gray-600 text-sm mb-4">Elegantní kabelky, shopper tašky a dámské peněženky</p>
                  <div className="text-black font-medium group-hover:text-gray-600 transition-colors">
                    Prohlédnout →
                  </div>
                </div>
              </div>
            </Link>

            {/* Business */}
            <Link href="/kategorie/business" className="group">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="h-64 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-4">💻</div>
                    <h3 className="text-2xl font-bold">Business</h3>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Pro profesionály</h4>
                  <p className="text-gray-600 text-sm mb-4">Aktovky, notebook tašky a business batohy</p>
                  <div className="text-black font-medium group-hover:text-gray-600 transition-colors">
                    Prohlédnout →
                  </div>
                </div>
              </div>
            </Link>

            {/* Cestování */}
            <Link href="/kategorie/cestovani" className="group">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="h-64 bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-4">🧳</div>
                    <h3 className="text-2xl font-bold">Cestování</h3>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Pro cestovatele</h4>
                  <p className="text-gray-600 text-sm mb-4">Kufry, cestovní tašky a cestovní batohy</p>
                  <div className="text-black font-medium group-hover:text-gray-600 transition-colors">
                    Prohlédnout →
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <ProductSection />

      <section className="py-8 md:py-16 bg-gray-50 hidden md:block">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-3 md:space-y-0 md:space-x-4 text-center md:text-left">
              <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Oficiální české zastoupení</h3>
                <p className="text-sm md:text-base text-gray-600">Reklamace a zákaznický servis řešíte snadno v češtině přímo u nás.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-3 md:space-y-0 md:space-x-4 text-center md:text-left">
              <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2"><strong>Garance nejlepší ceny</strong></h3>
                <p className="text-sm md:text-base text-gray-600">
                  <strong>Našli jste identický produkt jinde levněji? Cenu dorovnáme a dáme navíc 5% slevu!</strong>
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-3 md:space-y-0 md:space-x-4 text-center md:text-left">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2"><strong>Doprava zdarma</strong></h3>
                <p className="text-sm md:text-base text-gray-600">
                  <strong>Při objednávce nad 2.500 Kč doručíme zdarma po celé ČR.</strong>
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-3 md:space-y-0 md:space-x-4 text-center md:text-left">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2"><strong>Záruka kvality</strong></h3>
                <p className="text-sm md:text-base text-gray-600">
                  <strong>2 roky záruka na všechny produkty Piquadro.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="py-16 bg-white flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        }
      >
        <SustainabilitySection expanded={sustainabilityExpanded} setExpanded={setSustainabilityExpanded} />
      </Suspense>

      <Suspense
        fallback={
          <div className="py-16 bg-gray-50 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        }
      >
        <CollectionsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="py-16 bg-white flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        }
      >
        <BrandStorySection />
      </Suspense>

      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-black mb-4">
                italskeBrasnarstvi<span className="text-gray-400">.cz</span>
              </h3>
              <p className="text-gray-400 mb-6">
                Oficiální český distributor značky Piquadro. Italské řemeslné umění s moderním designem.
              </p>
              <div className="space-y-2 text-gray-400">
                <div>📞 +420 774 977 971</div>
                <div>✉️ info@italskeBrasnarstvi.cz</div>
                <div>🕒 Po-Pá: 10:00-16:00</div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Nakupovat</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Batohy na notebook</li>
                <li>KOŽENÉ PENĚŽENKY</li>
                <li>CESTOVNÍ KUFRY</li>
                <li>DÁMSKÉ KABELKY</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Zákaznický servis</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Sledovat zásilku</li>
                <li>Vrácení a výměna</li>
                <li>Časté dotazy</li>
                <li>Kontaktujte nás</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2025 italskeBrasnarstvi.cz - Oficiální distributor Piquadro</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
