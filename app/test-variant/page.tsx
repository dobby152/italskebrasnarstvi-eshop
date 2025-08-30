"use client"

import { useState } from "react"
import { useVariants } from "../hooks/useVariants"
import { formatPrice } from "../lib/utils"

export default function TestVariantPage() {
  const [baseSku, setBaseSku] = useState("BD6658W")
  const { variantGroup, loading, error, selectedVariant, setSelectedVariant, fetchVariantGroup } = useVariants()

  const handleFetchVariants = () => {
    fetchVariantGroup(baseSku)
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Variant System</h1>
        
        <div className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={baseSku}
              onChange={(e) => setBaseSku(e.target.value)}
              placeholder="Enter base SKU"
              className="px-4 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleFetchVariants}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              Fetch Variants
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <p>Loading variants...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Error: {error}</p>
          </div>
        )}

        {variantGroup && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Base Product: {variantGroup.baseProduct.name}
            </h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Variants:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {variantGroup.variants.map((variant) => (
                  <div 
                    key={variant.id} 
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedVariant?.id === variant.id 
                        ? "border-black bg-black text-white" 
                        : "border-gray-300 bg-white"
                    }`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <h4 className="font-bold">{variant.name}</h4>
                    <p className="text-sm">SKU: {variant.sku}</p>
                    <p className="text-lg font-semibold">{formatPrice(variant.price)} Kč</p>
                    
                    {variant.attributes && (
                      <div className="mt-2">
                        {Object.entries(variant.attributes).map(([key, attr]) => (
                          <span key={key} className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-1">
                            {attr.displayValue}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedVariant && (
              <div className="mt-8 p-4 bg-white border border-gray-300 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Selected Variant</h3>
                <p className="font-bold">{selectedVariant.name}</p>
                <p>SKU: {selectedVariant.sku}</p>
                <p>Price: {formatPrice(selectedVariant.price)} Kč</p>
                <p>Status: {selectedVariant.status}</p>
                <p>Inventory: {selectedVariant.inventory_quantity} items</p>
                
                {selectedVariant.attributes && (
                  <div className="mt-2">
                    <h4 className="font-semibold">Attributes:</h4>
                    {Object.entries(selectedVariant.attributes).map(([key, attr]) => (
                      <div key={key} className="ml-2">
                        <span className="font-medium">{attr.displayName}:</span> {attr.displayValue}
                        {attr.hexColor && (
                          <span 
                            className="inline-block w-4 h-4 rounded-full ml-2 border border-gray-300"
                            style={{ backgroundColor: attr.hexColor }}
                          ></span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}