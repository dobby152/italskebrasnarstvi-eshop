import { Button } from "../app/components/ui/button"
import { Star } from "lucide-react"

export default function BrandStorySection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-white">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black mb-6">MADE IN ITALY</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Kvalitní ruční práce. Všechny produkty Piquadro jsou výsledkem pečlivého designu a používají výhradně
                italské kůže.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-left">
                  <div className="text-2xl font-bold mb-1">30+</div>
                  <div className="text-sm text-gray-400">Let zkušeností</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold mb-1">100%</div>
                  <div className="text-sm text-gray-400">Italská kůže</div>
                </div>
              </div>

              <Button className="bg-white text-black hover:bg-gray-100 px-6 py-3">Zobrazit všechno</Button>
            </div>
            <div className="relative">
              <div className="w-full h-[300px] rounded-full overflow-hidden">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                >
                  <source src="/460cf424123f4804b0449742ac4b6279.HD-1080p-7.2Mbps-22008731.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="absolute -top-2 -right-2 bg-white rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-900">4.9/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
