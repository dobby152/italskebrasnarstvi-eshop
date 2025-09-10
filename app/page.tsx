"use client"


import React from "react"
import { Button } from "./components/ui/button"
import { useState, useEffect } from "react"
import Image from 'next/image'
import { ClientWebVitals } from "./components/client-web-vitals"
import Header from "./components/header"
import { Star } from "lucide-react"
import Link from "next/link"

import ProductSection from "./components/product-section"
import SustainabilitySection from "./components/sustainability-section"
import BrandStorySection from "./components/brand-story-section"

export default function HomePage() {
  const [sustainabilityExpanded, setSustainabilityExpanded] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <ClientWebVitals />
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

        <div className="relative z-10 container mx-auto px-6 h-full flex items-center justify-center text-center sm:justify-start sm:text-left">
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
              <Link href="/produkty">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-3 font-semibold text-base shadow-xl">
                  Nakupovat nyní
                </Button>
              </Link>
              <Link href="/o-nas">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 bg-transparent text-base shadow-xl"
                >
                  O nás
                </Button>
              </Link>
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
                  <div className="text-center">
                    <h3 className="text-4xl font-bold mb-2 drop-shadow-lg text-white">MUŽI</h3>
                    <p className="text-lg drop-shadow-md text-white">Objevte pánskou kolekci aktovek a tašek</p>
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
                  <div className="text-center">
                    <h3 className="text-4xl font-bold mb-2 drop-shadow-lg text-white">ŽENY</h3>
                    <p className="text-lg drop-shadow-md text-white">Objevte dámskou kolekci kabelek a tašek</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>


      {/* Výhody */}
      <section className="py-8 md:py-16 bg-gray-50">
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
                <p className="text-sm md:text-base text-gray-800 font-semibold">Servis v češtině přímo u nás.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-3 md:space-y-0 md:space-x-4 text-center md:text-left">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 12l3 3l6-6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Garance nejlepší ceny</h3>
                <p className="text-sm md:text-base text-gray-800 font-semibold">
                  Najdete levněji? Dorovnáme a dáme 5% slevu navíc!
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
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Doprava zdarma</h3>
                <p className="text-sm md:text-base text-gray-800 font-semibold">
                  Nad 2.500 Kč zdarma po celé ČR.
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
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Záruka kvality</h3>
                <p className="text-sm md:text-base text-gray-800 font-semibold">
                  2 roky záruka na všechny produkty.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Naše kolekce podle Piquadro */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Naše kolekce</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Objevte ikonické kolekce Piquadro - od sportovně elegantní po business luxus
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Black Square Kolekce */}
            <Link href="/produkty" className="group relative overflow-hidden rounded-lg">
              <div className="relative h-96">
                <img 
                  src="/black-square.webp" 
                  alt="Black Square kolekce" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-3xl font-bold text-white mb-2">BLACK SQUARE</h3>
                  <p className="text-white/90 text-sm">Elegantní business styl</p>
                </div>
              </div>
            </Link>

            {/* Blue Square Kolekce */}
            <Link href="/produkty" className="group relative overflow-hidden rounded-lg">
              <div className="relative h-96">
                <img 
                  src="/blue-square.webp" 
                  alt="Blue Square kolekce" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-3xl font-bold text-white mb-2">BLUE SQUARE</h3>
                  <p className="text-white/90 text-sm">Sportovně elegantní design</p>
                </div>
              </div>
            </Link>

            {/* Modus Kolekce */}
            <Link href="/produkty" className="group relative overflow-hidden rounded-lg">
              <div className="relative h-96">
                <img 
                  src="/modus.webp" 
                  alt="Modus kolekce" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-3xl font-bold text-white mb-2">MODUS</h3>
                  <p className="text-white/90 text-sm">Technologie a styl v harmonii</p>
                </div>
              </div>
            </Link>

            {/* Circle Kolekce */}
            <Link href="/produkty" className="group relative overflow-hidden rounded-lg">
              <div className="relative h-96">
                <img 
                  src="/circle.webp" 
                  alt="Circle kolekce" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-3xl font-bold text-white mb-2">CIRCLE</h3>
                  <p className="text-white/90 text-sm">Luxusní business styl</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <ProductSection />


      <SustainabilitySection expanded={sustainabilityExpanded} setExpanded={setSustainabilityExpanded} />

      <BrandStorySection />

      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image src="/logo.avif" alt="italskeBrasnarstvi.cz" width={192} height={60} className="w-48" priority />
              <p className="text-white mb-6">
                Oficiální český distributor značky Piquadro. <span className="font-semibold">Italské řemeslné umění s moderním designem.</span>
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Nakupovat</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/produkty?productType=brasnyObaly" className="hover:text-white transition-colors">Batohy na notebook</Link></li>
                <li><Link href="/produkty?productType=penezenkybusiness" className="hover:text-white transition-colors">KOŽENÉ PENĚŽENKY</Link></li>
                <li><Link href="/produkty?productType=cestovani" className="hover:text-white transition-colors">CESTOVNÍ KUFRY</Link></li>
                <li><Link href="/produkty?productType=taskyKabelky" className="hover:text-white transition-colors">DÁMSKÉ KABELKY</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Zákaznický servis</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/sledovani" className="hover:text-white transition-colors">Sledovat zásilku</Link></li>
                <li><Link href="/vraceni" className="hover:text-white transition-colors">Vrácení a výměna</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">Časté dotazy</Link></li>
                <li><Link href="/kontakt" className="hover:text-white transition-colors">Kontaktujte nás</Link></li>
                <li><Link href="/obchodni-podminky" className="hover:text-white transition-colors">Obchodní podmínky</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Kontakt & Newsletter</h4>
              <div className="space-y-3 text-gray-400 text-sm mb-6">
                <div className="flex items-center">
                  <a href="tel:+420774977971" className="hover:text-white transition-colors">+420 774 977 971</a>
                </div>
                <div className="flex items-center">
                  <a href="mailto:info@italskeBrasnarstvi.cz" className="hover:text-white transition-colors">info@italskeBrasnarstvi.cz</a>
                </div>
                <div className="flex items-center">
                  <span>Po-Pá: 10:00-16:00</span>
                </div>
              </div>
              <div>
                <h5 className="font-semibold mb-3 text-white">Odběr novinek</h5>
                <form 
                  className="flex flex-col space-y-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const email = formData.get('email') as string;
                    
                    try {
                      const response = await fetch('/api/admin/newsletter', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email }),
                      });
                      
                      if (response.ok) {
                        alert('Děkujeme za přihlášení k odběru novinek!');
                        (e.target as HTMLFormElement).reset();
                      } else if (response.status === 409) {
                        alert('Tento e-mail je již přihlášen k odběru novinek.');
                      } else {
                        throw new Error('Failed to subscribe');
                      }
                    } catch (error) {
                      alert('Došlo k chybě při přihlášení. Zkuste to prosím později.');
                    }
                  }}
                >
                  <input
                    type="email"
                    name="email"
                    placeholder="Váš e-mail"
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white text-sm"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-white text-black px-4 py-2 rounded font-semibold hover:bg-gray-200 transition-colors text-sm"
                  >
                    Odebírat
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2025 - Oficiální distributor Piquadro</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
