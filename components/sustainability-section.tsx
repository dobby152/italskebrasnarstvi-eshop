"use client"

import { Button } from "../app/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface SustainabilitySectionProps {
  expanded: boolean
  setExpanded: (expanded: boolean) => void
}

export default function SustainabilitySection({ expanded, setExpanded }: SustainabilitySectionProps) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="cursor-pointer bg-gray-50 rounded-2xl p-8 border hover:shadow-lg transition-all duration-300"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Udržitelnost na prvním místě</h3>
                  <p className="text-gray-600">Náš závazek k životnímu prostředí a sociální odpovědnosti</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-600">{expanded ? "Skrýt" : "Zobrazit více"}</span>
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-6 bg-white rounded-2xl border shadow-lg p-8 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-gray-600 rounded-xl p-6 text-white mb-8">
                <blockquote className="text-lg italic mb-4">
                  "Udržitelnost znamená respekt ke zdraví pracovníků a spotřebitelů, stejně jako k lidským právům a
                  životnímu prostředí..."
                </blockquote>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">MP</span>
                  </div>
                  <div>
                    <p className="font-bold">Marco Palmieri</p>
                    <p className="text-white/80 text-sm">Generální ředitel Piquadro Group</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center bg-gray-50 rounded-xl p-6">
                  <div className="text-3xl font-black text-gray-600 mb-2">100%</div>
                  <div className="text-gray-600">Recyklovaný nylon</div>
                </div>
                <div className="text-center bg-gray-100 rounded-xl p-6">
                  <div className="text-3xl font-black text-gray-700 mb-2">3 roky</div>
                  <div className="text-gray-600">Zprávy o udržitelnosti</div>
                </div>
                <div className="text-center bg-gray-200 rounded-xl p-6">
                  <div className="text-3xl font-black text-gray-800 mb-2">PQ Index</div>
                  <div className="text-gray-600">Transparentní měření</div>
                </div>
              </div>

              <div className="text-center">
                <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3">Prohlédnout eco kolekce</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
