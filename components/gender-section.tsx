"use client"

import Link from "next/link"
import Image from "next/image"

export default function GenderSection() {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* MUŽI */}
          <div className="group relative overflow-hidden rounded-2xl bg-gray-100 h-96">
            <Image
              src="/muzi.webp"
              alt="Pánské tašky a batohy"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              <div className="absolute bottom-8 left-8">
                <h2 className="text-white text-4xl font-bold mb-4">MUŽI</h2>
                <p className="text-white/90 mb-6 text-lg">Stylové tašky a batohy pro moderní muže</p>
                <Link 
                  href="/kategorie/pansky"
                  className="inline-block bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  NAKUPOVAT
                </Link>
              </div>
            </div>
          </div>

          {/* ŽENY */}
          <div className="group relative overflow-hidden rounded-2xl bg-gray-100 h-96">
            <Image
              src="/zeny.webp"
              alt="Dámské kabelky a tašky"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              <div className="absolute bottom-8 left-8">
                <h2 className="text-white text-4xl font-bold mb-4">ŽENY</h2>
                <p className="text-white/90 mb-6 text-lg">Elegantní kabelky a tašky pro každou příležitost</p>
                <Link 
                  href="/kategorie/damsky"
                  className="inline-block bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  NAKUPOVAT
                </Link>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}