"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Separator } from "./ui/separator"
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar,
  Search,
  ExternalLink,
  Loader2
} from "lucide-react"

interface TrackingEvent {
  id: string
  status: string
  description: string
  location?: string
  timestamp: string
  is_current: boolean
}

interface TrackingInfo {
  order_id: string
  order_number: string
  tracking_number: string
  carrier: string
  status: string
  estimated_delivery: string
  current_location?: string
  events: TrackingEvent[]
  shipping_address: {
    street: string
    city: string
    postal_code: string
    country: string
  }
}

const statusIcons = {
  'order_placed': Clock,
  'order_confirmed': CheckCircle,
  'processing': Package,
  'shipped': Truck,
  'in_transit': Truck,
  'out_for_delivery': Truck,
  'delivered': CheckCircle,
  'exception': Clock,
  'returned': Package
}

const statusLabels = {
  'order_placed': 'Objednávka vytvořena',
  'order_confirmed': 'Objednávka potvrzena',
  'processing': 'Zpracovává se',
  'shipped': 'Odesláno',
  'in_transit': 'V přepravě',
  'out_for_delivery': 'Na cestě k doručení',
  'delivered': 'Doručeno',
  'exception': 'Problém s doručením',
  'returned': 'Vráceno'
}

export default function OrderTracking() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const trackOrder = async (number?: string) => {
    const numberToTrack = number || trackingNumber
    if (!numberToTrack.trim()) {
      setError('Zadejte sledovací číslo')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/orders/track?number=${encodeURIComponent(numberToTrack)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Sledovací číslo nebylo nalezeno')
      }

      const data = await response.json()
      setTrackingInfo(data.tracking)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst informace o zásilce')
      setTrackingInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const openCarrierTracking = () => {
    if (!trackingInfo?.tracking_number) return
    
    const carrierUrls = {
      'česká pošta': `https://www.posta.cz/trackandtrace/-/zasilka/cislo?parcelNumbers=${trackingInfo.tracking_number}`,
      'ppI': `https://www.ppl.cz/main2.aspx?cls=package&idSearch=${trackingInfo.tracking_number}`,
      'dhl': `https://www.dhl.com/cz-cs/home/tracking.html?tracking-id=${trackingInfo.tracking_number}`,
      'ups': `https://www.ups.com/track?tracknum=${trackingInfo.tracking_number}`,
      'fedex': `https://www.fedex.com/apps/fedextrack/?tracknumber_list=${trackingInfo.tracking_number}`
    }

    const url = carrierUrls[trackingInfo.carrier.toLowerCase() as keyof typeof carrierUrls] 
      || `https://www.google.com/search?q=track+${trackingInfo.tracking_number}`
    
    window.open(url, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sledování zásilky
        </h1>
        <p className="text-gray-600">
          Zadejte sledovací číslo pro zobrazení aktuálního stavu zásilky
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Zadejte sledovací číslo (např. RR123456789CZ)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && trackOrder()}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <Button onClick={() => trackOrder()} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Sledovat
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {trackingInfo && (
        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Objednávka #{trackingInfo.order_number}
                    <Badge className="bg-blue-100 text-blue-800">
                      {statusLabels[trackingInfo.status as keyof typeof statusLabels] || trackingInfo.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Sledovací číslo: {trackingInfo.tracking_number}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={openCarrierTracking}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Sledovat u dopravce
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Truck className="h-4 w-4" />
                    Dopravce: {trackingInfo.carrier}
                  </div>
                  {trackingInfo.current_location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      Aktuální poloha: {trackingInfo.current_location}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Očekávané doručení: {new Date(trackingInfo.estimated_delivery).toLocaleDateString('cs-CZ')}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Doručovací adresa</h4>
                  <div className="text-sm text-gray-600">
                    <p>{trackingInfo.shipping_address.street}</p>
                    <p>{trackingInfo.shipping_address.postal_code} {trackingInfo.shipping_address.city}</p>
                    <p>{trackingInfo.shipping_address.country}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Historie zásilky</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackingInfo.events.map((event, index) => {
                  const StatusIcon = statusIcons[event.status as keyof typeof statusIcons] || Package
                  const isLast = index === trackingInfo.events.length - 1

                  return (
                    <div key={event.id} className="relative">
                      {/* Timeline Line */}
                      {!isLast && (
                        <div className="absolute left-5 top-10 w-0.5 h-12 bg-gray-200" />
                      )}
                      
                      {/* Event */}
                      <div className="flex gap-4">
                        <div className={`
                          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                          ${event.is_current 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-400'
                          }
                        `}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`font-medium ${
                              event.is_current ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {statusLabels[event.status as keyof typeof statusLabels] || event.status}
                            </h4>
                            <span className="text-sm text-gray-500 flex-shrink-0 ml-4">
                              {new Date(event.timestamp).toLocaleString('cs-CZ')}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-1">
                            {event.description}
                          </p>
                          
                          {event.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {trackingInfo.events.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Zatím nejsou k dispozici žádné informace o zásilce</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Estimate */}
          {trackingInfo.status !== 'delivered' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Očekávané doručení</h4>
                    <p className="text-blue-700">
                      {new Date(trackingInfo.estimated_delivery).toLocaleDateString('cs-CZ', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Potřebujete pomoc?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            <p className="mb-2">Sledovací číslo najdete v:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>E-mailu s potvrzením odeslání objednávky</li>
              <li>Detailu objednávky v sekci "Můj účet"</li>
              <li>SMS zprávě od dopravce (pokud jste souhlasili s jejich zasíláním)</li>
            </ul>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Máte problém s doručením?</span>
            <Button variant="link" size="sm" className="p-0">
              Kontaktovat podporu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}