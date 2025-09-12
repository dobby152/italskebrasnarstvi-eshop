"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { CheckCircle, Package, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  status: string
  total_price: number
  currency: string
  shipping_address: any
  created_at: string
}

export default function CheckoutSuccess() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      fetchOrderDetails()
    }
  }, [sessionId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/checkout/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'x-session-id': getSessionId()
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        setError('Nepodařilo se načíst detaily objednávky')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Došlo k chybě při načítání objednávky')
    } finally {
      setLoading(false)
    }
  }

  const getSessionId = () => {
    let sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Načítám detaily objednávky...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">
            Objednávka byla úspěšně dokončena!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button asChild className="mt-4">
                <Link href="/">Zpět na hlavní stránku</Link>
              </Button>
            </div>
          ) : order ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  Co bude následovat?
                </h3>
                <ul className="text-green-700 space-y-1 text-sm">
                  <li>• Obdržíte e-mail s potvrzením objednávky</li>
                  <li>• Vaše objednávka bude zpracována do 1-2 pracovních dnů</li>
                  <li>• Budete informováni o expedici s číslem zásilky</li>
                  <li>• Dostanete produkty do 3-5 pracovních dnů</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Číslo objednávky:</h4>
                  <p className="font-mono text-lg">#{order.id.slice(-8).toUpperCase()}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Celková částka:</h4>
                  <p className="font-bold text-lg">
                    {order.total_price.toLocaleString('cs-CZ')} {order.currency}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Status:</h4>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="capitalize">{order.status}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Datum objednávky:</h4>
                  <p>{new Date(order.created_at).toLocaleString('cs-CZ')}</p>
                </div>
              </div>

              {order.shipping_address && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Dodací adresa:</h4>
                  <div className="text-sm text-gray-600">
                    <p>{order.shipping_address.name}</p>
                    <p>{order.shipping_address.line1}</p>
                    {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                    <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                    <p>{order.shipping_address.country}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button asChild className="flex-1">
                  <Link href="/produkty">Pokračovat v nákupu</Link>
                </Button>
                
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/">Zpět na hlavní stránku</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Děkujeme za vaši objednávku! E-mail s potvrzením bude odeslán brzy.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/produkty">Pokračovat v nákupu</Link>
                </Button>
                
                <Button variant="outline" asChild>
                  <Link href="/">Zpět na hlavní stránku</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}