import { Button } from "./ui/button"
import { Card } from "./ui/card"

export default function CollectionsSection() {
  const collections = [
    {
      id: 1,
      name: "Městské batohy",
      description: "Stylové a praktické batohy pro každodenní nošení",
      image: "/1_CA4818AP-GR_1.jpg",
      tags: ["Městský styl", "Vodotěsné", "Anti-theft"]
    },
    {
      id: 2,
      name: "Notebook brašny",
      description: "Ochranné brašny pro váš laptop",
      image: "/1_CA6637W129-BLU_1_2640a8f6-0894-4aa9-92d6-4eb4606330b4.jpg",
      tags: ["Notebook 15\"", "RFID ochrana", "Kožené"]
    },
    {
      id: 3,
      name: "Dámské tašky",
      description: "Elegantní tašky pro moderní ženy",
      image: "/1_BD3336W92-AZBE2_1.jpg",
      tags: ["Elegantní", "Praktické", "Laptop 14\""]
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Naše kolekce</h2>
          <p className="text-lg text-gray-600">Objevte jedinečné kolekce pro moderní životní styl</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {collections?.map((collection, index) => (
            <Card
              key={index}
              className="group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-300"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold mb-1">{collection.name}</h3>
                  <p className="text-white/90 text-sm mb-3">{collection.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {collection.tags?.map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 bg-white/20 backdrop-blur-sm text-xs rounded-full text-white/90">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6">

                <Button className="w-full bg-black hover:bg-gray-800 text-white transition-all duration-300 group-hover:bg-gray-700">
                  Prohlédnout kolekci
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
