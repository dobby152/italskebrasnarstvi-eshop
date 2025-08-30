'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { getImageUrl, getProductDisplayName, getProductDisplayCollection } from '@/lib/api';

export default function ProductSection() {
  const { products, loading } = useProducts({ 
    limit: 12, 
    sortBy: 'id', 
    sortOrder: 'asc' 
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Nejprodávanější produkty
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Objevte naše nejoblíbenější kousky, které si zamilovali tisíce zákazníků po celé České republice
          </p>
        </div>

        {/* Products Grid */}
        <div className="relative">
          {/* Navigační šipky */}
          <button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {loading ? (
            // Enhanced skeleton loader
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide" 
              style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
            >
              {Array(12).fill(0).map((_, index) => (
                <div key={index} className="group flex-none w-80">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 h-full">
                    <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="p-6">
                      <div className="h-5 bg-gray-200 animate-pulse mb-3 w-4/5 rounded"></div>
                      <div className="h-4 bg-gray-200 animate-pulse mb-4 w-3/5 rounded"></div>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                          ))}
                        </div>
                        <div className="h-6 bg-gray-200 animate-pulse w-16 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide" 
              style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
            >
              {products.map((product) => {
                const mainImage = product.images?.[0];
                const imageUrl = mainImage ? getImageUrl(mainImage) : '/placeholder.jpg';
                const displayName = getProductDisplayName(product);
                const displayCollection = getProductDisplayCollection(product);

                return (
                  <Link 
                    key={product.id} 
                    href={`/produkt/${product.slug}`}
                    className="group flex-none w-80 transform transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 h-full">
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <img
                          src={imageUrl}
                          alt={displayName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Stock status */}
                        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Skladem
                        </div>
                        
                        {/* Price badge */}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                          {product.price} Kč
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {displayCollection}
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-gray-900 mb-3 text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                          {displayName}
                        </h3>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            {/* Star rating */}
                            {Array(5).fill(0).map((_, i) => (
                              <svg
                                key={i}
                                className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
                                />
                              </svg>
                            ))}
                            <span className="text-sm text-gray-600 ml-2">4.8</span>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xs text-gray-500">od</div>
                            <div className="font-black text-lg text-gray-900">{product.price} Kč</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link 
              href="/produkty" 
              className="inline-flex items-center px-8 py-4 bg-black hover:bg-gray-800 text-white font-bold rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 transform"
            >
              Zobrazit všechny produkty
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}