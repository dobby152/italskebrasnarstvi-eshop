import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, Clock, Car, Train } from "lucide-react"
import Link from "next/link"

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              italskeBrasnarstvi.cz
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Domů
              </Link>
              <Link href="/produkty" className="text-gray-600 hover:text-gray-900">
                Produkty
              </Link>
              <Link href="/o-nas" className="text-gray-600 hover:text-gray-900">
                O nás
              </Link>
              <Link href="/kontakt" className="text-gray-900 font-medium">
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kontaktujte nás</h1>
          <p className="text-lg text-gray-600">Jsme tu pro vás. Rádi odpovíme na vaše dotazy a pomůžeme s výběrem.</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Napište nám</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jméno *</label>
                      <Input placeholder="Vaše jméno" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Příjmení *</label>
                      <Input placeholder="Vaše příjmení" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
                    <Input type="email" placeholder="vas@email.cz" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <Input type="tel" placeholder="+420 123 456 789" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Předmět</label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                      <option>Obecný dotaz</option>
                      <option>Dotaz k produktu</option>
                      <option>Reklamace</option>
                      <option>Objednávka</option>
                      <option>Jiné</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zpráva *</label>
                    <Textarea placeholder="Napište nám svůj dotaz nebo zprávu..." rows={5} required />
                  </div>

                  <div className="flex items-center">
                    <input type="checkbox" id="gdpr" className="mr-2" required />
                    <label htmlFor="gdpr" className="text-sm text-gray-600">
                      Souhlasím se zpracováním osobních údajů podle GDPR *
                    </label>
                  </div>

                  <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800">
                    Odeslat zprávu
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Store Prague */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Prodejna Praha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">Adresa:</p>
                  <p className="text-gray-600">
                    Wenceslas Square 14
                    <br />
                    110 00 Praha 1
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">+420 224 234 567</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">praha@italskebrasnarstvi.cz</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium text-sm">Otevírací doba:</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Po - Pá: 9:00 - 19:00</p>
                    <p>So: 9:00 - 17:00</p>
                    <p>Ne: 10:00 - 16:00</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">Doprava:</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Train className="h-4 w-4 mr-1" />
                      Metro A, B - Můstek
                    </div>
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-1" />
                      Parkoviště Kotva
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store Brno */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Prodejna Brno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">Adresa:</p>
                  <p className="text-gray-600">
                    Náměstí Svobody 8<br />
                    602 00 Brno
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">+420 543 234 567</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">brno@italskebrasnarstvi.cz</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium text-sm">Otevírací doba:</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Po - Pá: 9:00 - 18:00</p>
                    <p>So: 9:00 - 16:00</p>
                    <p>Ne: zavřeno</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">Doprava:</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Train className="h-4 w-4 mr-1" />
                      Tram 1, 2, 4 - Náměstí Svobody
                    </div>
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-1" />
                      Parkoviště Galerie Vaňkovka
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Online Support */}
            <Card>
              <CardHeader>
                <CardTitle>Online podpora</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">Zákaznická linka:</p>
                  <p className="text-lg font-semibold text-gray-900">+420 800 123 456</p>
                  <p className="text-sm text-gray-600">Bezplatná linka</p>
                </div>

                <div>
                  <p className="font-medium">E-mail:</p>
                  <p className="text-gray-900">info@italskebrasnarstvi.cz</p>
                </div>

                <div>
                  <p className="font-medium">Doba odezvy:</p>
                  <p className="text-sm text-gray-600">
                    E-mail: do 24 hodin
                    <br />
                    Telefon: Po-Pá 8:00-17:00
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <p className="font-medium mb-2">Rychlé odkazy:</p>
                  <div className="space-y-2">
                    <Link href="/reklamace" className="block text-sm text-blue-600 hover:underline">
                      Jak podat reklamaci
                    </Link>
                    <Link href="/doprava" className="block text-sm text-blue-600 hover:underline">
                      Doprava a platba
                    </Link>
                    <Link href="/vraceni" className="block text-sm text-blue-600 hover:underline">
                      Vrácení zboží
                    </Link>
                    <Link href="/faq" className="block text-sm text-blue-600 hover:underline">
                      Často kladené otázky
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Najdete nás zde</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
                <p className="text-gray-600">Mapa s označením našich prodejen</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
