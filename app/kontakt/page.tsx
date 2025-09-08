import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Phone, Mail, Clock, MapPin, MessageCircle } from "lucide-react"
import Link from "next/link"
import Header from "../components/header"

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-black py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Kontaktujte nás
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Máte dotazy nebo potřebujete radu ohledně našich produktů či objednávky? Nebojte se nám napsat nebo zavolat. Jsme tu, abychom vám pomohli.
          </p>
        </div>
      </div>

      {/* Contact Info */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Email */}
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">E-mail</h3>
                <a href="mailto:info@italskeBrasnarstvi.cz" className="text-blue-600 hover:underline">
                  info@italskeBrasnarstvi.cz
                </a>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Telefon</h3>
                <a href="tel:+420774977971" className="text-green-600 hover:underline">
                  +420 774 977 971
                </a>
              </CardContent>
            </Card>

            {/* Hours */}
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Otevírací doba</h3>
                <p className="text-gray-600">Po-Pá: 10:00 - 16:00</p>
                <p className="text-sm text-gray-500">kromě svátků</p>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Zákaznický servis</h3>
                <p className="text-gray-600">Rychlá odpověď na vaše dotazy</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stores */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Partnerské prodejny</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Můžete navštívit také jednu z partnerských prodejen v Praze, kde vám školený personál přímo poradí s výběrem a vy si můžete produkty detailně prohlédnout.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Westfield Chodov */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">PIQUADRO Westfield Chodov</h3>
                    <p className="text-gray-600 mb-2">
                      Roztylská 2321/19<br />
                      Praha 11-Chodov 148 00<br />
                      Česko
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Po — Ne: 9.00 — 21.00 hod.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Outlet */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">PIQUADRO Premium Outlet Prague</h3>
                    <p className="text-gray-600 mb-2">
                      Ke Kopanině 421<br />
                      Tuchomerice 252 67<br />
                      Česko
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Po — Ne: 10.00 — 20.00 hod.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Potřebujete poradit?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Naši odborníci vám rádi pomohou s výběrem správného produktu pro vaše potřeby
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              <a href="mailto:info@italskeBrasnarstvi.cz">
                <Mail className="h-5 w-5 mr-2" />
                Napsat e-mail
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900">
              <a href="tel:+420774977971">
                <Phone className="h-5 w-5 mr-2" />
                Zavolat
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
