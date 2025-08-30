import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Award, Users, Globe, Heart } from "lucide-react"
import Link from "next/link"

export default function ONasPage() {
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
              <Link href="/o-nas" className="text-gray-900 font-medium">
                O nás
              </Link>
              <Link href="/kontakt" className="text-gray-600 hover:text-gray-900">
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Oficiální české zastoupení značky Piquadro
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Více než 15 let přinášíme českým zákazníkům to nejlepší z italského designu a řemeslné tradice
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-green-100 text-green-800 px-4 py-2">
                <Award className="h-4 w-4 mr-2" />
                Oficiální partner
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
                <Globe className="h-4 w-4 mr-2" />
                15+ let na trhu
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 px-4 py-2">
                <Users className="h-4 w-4 mr-2" />
                10 000+ spokojených zákazníků
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Náš příběh</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Začali jsme v roce 2008 s jasnou vizí - přinést českým zákazníkům autentické italské kožené výrobky
                  nejvyšší kvality. Jako oficiální zastoupení značky Piquadro jsme se stali mostem mezi italským
                  řemeslným uměním a českými zákazníky.
                </p>
                <p>
                  Piquadro je synonymem pro inovaci, kvalitu a italský styl. Každý produkt je výsledkem pečlivého výběru
                  materiálů, precizního zpracování a neustálého hledání dokonalosti. Naše produkty kombinují tradiční
                  řemeslné techniky s moderními technologiemi.
                </p>
                <p>
                  Věříme, že kvalitní kožený výrobek není jen doplněk, ale investice na celý život. Proto nabízíme pouze
                  originální produkty s plnou zárukou a profesionálním servisem v češtině.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="Italské řemeslné dílny"
                className="rounded-lg shadow-lg"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-lg">
                <div className="text-2xl font-bold text-gray-900">1958</div>
                <div className="text-sm text-gray-600">Založení značky Piquadro</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Naše hodnoty</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Principy, které nás vedou při každodenní práci a budování vztahů se zákazníky
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Kvalita</h3>
                <p className="text-gray-600">Pouze originální produkty s certifikátem kvality a plnou zárukou</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Péče o zákazníky</h3>
                <p className="text-gray-600">Osobní přístup, poradna v češtině a rychlé vyřízení reklamací</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Tradice</h3>
                <p className="text-gray-600">Respekt k italskému řemeslnému dědictví a dlouholeté tradici</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Důvěra</h3>
                <p className="text-gray-600">Transparentnost, spolehlivost a dlouhodobé partnerství</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Náš tým</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Lidé, kteří stojí za úspěchem našeho obchodu a spokojeností zákazníků
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <img
                  src="/placeholder.svg?height=200&width=200"
                  alt="Tomáš Novák"
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold mb-2">Tomáš Novák</h3>
                <p className="text-gray-600 mb-3">Jednatel a zakladatel</p>
                <p className="text-sm text-gray-500">15 let zkušeností v oboru, expert na italské kožené výrobky</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <img
                  src="/placeholder.svg?height=200&width=200"
                  alt="Jana Svobodová"
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold mb-2">Jana Svobodová</h3>
                <p className="text-gray-600 mb-3">Vedoucí prodeje</p>
                <p className="text-sm text-gray-500">Specialistka na poradenství a výběr produktů pro zákazníky</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <img
                  src="/placeholder.svg?height=200&width=200"
                  alt="Petr Dvořák"
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold mb-2">Petr Dvořák</h3>
                <p className="text-gray-600 mb-3">Zákaznický servis</p>
                <p className="text-sm text-gray-500">Odborník na reklamace a pozáruční servis produktů</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Máte otázky?</h2>
          <p className="text-xl text-gray-300 mb-8">Rádi vám poradíme s výběrem nebo odpovíme na jakékoli dotazy</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              <Link href="/kontakt">
                <Phone className="h-5 w-5 mr-2" />
                Kontaktujte nás
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent"
            >
              <Link href="/produkty">Prohlédnout produkty</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
