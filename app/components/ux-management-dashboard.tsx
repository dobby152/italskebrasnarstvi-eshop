"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Search, 
  Brain, 
  ShoppingCart, 
  TestTube, 
  TrendingUp, 
  Users, 
  Eye,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react'

interface UXDashboardProps {
  onClose?: () => void
}

export function UXManagementDashboard({ onClose }: UXDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [experiments, setExperiments] = useState([])
  const [abandonedCarts, setAbandonedCarts] = useState([])
  const [searchAnalytics, setSearchAnalytics] = useState([])
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    loadUXData()
  }, [])

  const loadUXData = async () => {
    try {
      // Load A/B experiments
      const expResponse = await fetch('/api/ab-testing/experiments')
      if (expResponse.ok) {
        const expData = await expResponse.json()
        setExperiments(expData.experiments || [])
      }

      // Load abandoned cart stats
      const cartResponse = await fetch('/api/analytics/cart-abandonment')
      if (cartResponse.ok) {
        const cartData = await cartResponse.json()
        setAbandonedCarts(cartData.recentAbandoned || [])
      }

      // Load search analytics
      const searchResponse = await fetch('/api/analytics/search')
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        setSearchAnalytics(searchData.topQueries || [])
      }
    } catch (error) {
      console.error('Failed to load UX data:', error)
    }
  }

  const toggleExperiment = async (experimentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    try {
      const response = await fetch('/api/ab-testing/experiments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: experimentId, status: newStatus })
      })
      
      if (response.ok) {
        loadUXData()
      }
    } catch (error) {
      console.error('Failed to update experiment:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">UX Management Dashboard</h1>
            <p className="text-gray-600">Správa pokročilých UX funkcí a optimalizace konverzí</p>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Zavřít
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktivní A/B testy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {experiments.filter((e: any) => e.status === 'active').length}
                  </p>
                </div>
                <TestTube className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Opuštěné košíky (24h)</p>
                  <p className="text-2xl font-bold text-gray-900">{abandonedCarts.length}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vyhledávání (dnes)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {searchAnalytics.reduce((sum: number, q: any) => sum + (q.count || 0), 0)}
                  </p>
                </div>
                <Search className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Doporučení</p>
                  <p className="text-2xl font-bold text-gray-900">Aktivní</p>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Přehled</TabsTrigger>
            <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
            <TabsTrigger value="cart-abandonment">Košík</TabsTrigger>
            <TabsTrigger value="search">Vyhledávání</TabsTrigger>
            <TabsTrigger value="recommendations">Doporučení</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Conversion Rate Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Celková konverze</span>
                      <span className="font-semibold">3.24%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Mobilní</span>
                      <span className="font-semibold">2.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Desktop</span>
                      <span className="font-semibold">3.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Behavior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Průměrný čas na stránce</span>
                      <span className="font-semibold">2m 34s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bounce rate</span>
                      <span className="font-semibold">42.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stránek na návštěvu</span>
                      <span className="font-semibold">3.7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* A/B Testing Tab */}
          <TabsContent value="ab-testing" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">A/B Testing Experiments</h2>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nový experiment
              </Button>
            </div>

            <div className="grid gap-6">
              {experiments.map((experiment: any) => (
                <Card key={experiment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {experiment.name}
                          <Badge variant={experiment.status === 'active' ? 'default' : 'secondary'}>
                            {experiment.status}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{experiment.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExperiment(experiment.id, experiment.status)}
                        >
                          {experiment.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {experiment.variants?.map((variant: any) => (
                        <div key={variant.id} className="text-center p-4 border rounded">
                          <div className="font-medium">{variant.name}</div>
                          <div className="text-sm text-gray-600">{variant.trafficAllocation}% traffic</div>
                          <div className="mt-2 text-lg font-bold">
                            {Math.random() * 5 + 1}%
                            <span className="text-sm text-gray-500 block">conv. rate</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Cart Abandonment Tab */}
          <TabsContent value="cart-abandonment" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Cart Abandonment Management</h2>
              <Button>Upravit nastavení</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Abandonment Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Abandonment Rate</span>
                      <span className="font-semibold">68.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recovery Rate</span>
                      <span className="font-semibold">12.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Cart Value</span>
                      <span className="font-semibold">2,450 Kč</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recovery Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Email 1 (1h)</span>
                      <span className="font-semibold">8.2% open rate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email 2 (24h)</span>
                      <span className="font-semibold">12.1% open rate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email 3 (72h)</span>
                      <span className="font-semibold">6.4% open rate</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Search Analytics</h2>
              <div className="flex gap-2">
                <Input 
                  placeholder="Hledat dotazy..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { query: 'kožené kabelky', count: 247, results: 23, clicks: 89 },
                    { query: 'pánské peněženky', count: 186, results: 45, clicks: 142 },
                    { query: 'Piquadro', count: 159, results: 67, clicks: 98 },
                    { query: 'černá kabelka', count: 134, results: 89, clicks: 67 },
                    { query: 'cestovní taška', count: 98, results: 34, clicks: 45 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{item.query}</div>
                        <div className="text-sm text-gray-600">
                          {item.count} hledání • {item.results} výsledků • {item.clicks} kliků
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {((item.clicks / item.count) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">CTR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">AI Recommendation Engine</h2>
              <Button>Upravit algoritmus</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Similar Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Click Rate</span>
                      <span className="font-semibold">14.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conv. Rate</span>
                      <span className="font-semibold">3.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Revenue</span>
                      <span className="font-semibold">28,450 Kč</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Bought</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Click Rate</span>
                      <span className="font-semibold">8.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conv. Rate</span>
                      <span className="font-semibold">2.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Revenue</span>
                      <span className="font-semibold">15,230 Kč</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personalized</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Click Rate</span>
                      <span className="font-semibold">18.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conv. Rate</span>
                      <span className="font-semibold">5.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Revenue</span>
                      <span className="font-semibold">42,180 Kč</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}