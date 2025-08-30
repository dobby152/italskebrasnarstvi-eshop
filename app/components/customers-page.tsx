"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Mail,
  MapPin,
  Calendar,
  Plus,
} from "lucide-react"
import { useCustomers } from "../hooks/use-customers"

const getStatusBadge = (status: string, label: string) => {
  const variants = {
    new: "bg-blue-100 text-blue-800",
    regular: "bg-green-100 text-green-800",
    vip: "bg-purple-100 text-purple-800",
  }

  return <Badge className={`${variants[status as keyof typeof variants]} border-0`}>{label}</Badge>
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0]?.toUpperCase() || "")
    .join("");
};

export function CustomersPage() {
  const { customers, stats, loading, error } = useCustomers()

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Načítání zákazníků...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Chyba při načítání zákazníků: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Zákazníci</h1>
              <p className="text-muted-foreground">Spravujte zákazníky a jejich objednávky</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Import zákazníků
              </Button>
              <Button variant="outline">Export</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Přidat zákazníka
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Hledat zákazníky..." className="pl-10" />
            </div>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filtrovat
            </Button>
            <select className="px-3 py-2 border border-border rounded-md text-sm bg-background">
              <option>Všichni zákazníci</option>
              <option>Noví zákazníci</option>
              <option>Pravidelní zákazníci</option>
              <option>VIP zákazníci</option>
            </select>
            <select className="px-3 py-2 border border-border rounded-md text-sm bg-background">
              <option>Všechny lokace</option>
              <option>Praha</option>
              <option>Brno</option>
              <option>Ostrava</option>
            </select>
          </div>

          {/* Customers Table */}
          <Card className="bg-card border-border">
              <CardHeader>
              <CardTitle className="text-lg font-semibold">Zákazníci ({(stats as any)?.customers?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Zákazník
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Lokace
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Objednávky
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Celkem utraceno
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Poslední objednávka
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Stav
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Akce
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {getInitials(customer.name)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-card-foreground cursor-pointer hover:underline">
                                {customer.name}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {(customer as any).location || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-card-foreground">{customer.orders}</div>
                          <div className="text-sm text-muted-foreground">objednávek</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-card-foreground">{customer.totalSpent}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {customer.lastOrder}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(customer.status, customer.statusLabel)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-card-foreground">{stats?.totalCustomers || 0}</div>
                <div className="text-sm text-muted-foreground">Celkem zákazníků</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats?.newThisMonth || 0}</div>
                <div className="text-sm text-muted-foreground">Nových tento měsíc</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats?.regularCustomers || 0}</div>
                <div className="text-sm text-muted-foreground">Pravidelní zákazníci</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{stats?.vipCustomers || 0}</div>
                <div className="text-sm text-muted-foreground">VIP zákazníci</div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Nejlepší zákazníci</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customers && customers.length > 0 ? (
                  customers
                    .sort(
                      (a, b) =>
                        Number.parseFloat(b.totalSpent.replace("$", "").replace(",", "")) -
                        Number.parseFloat(a.totalSpent.replace("$", "").replace(",", "")),
                    )
                    .slice(0, 3)
                    .map((customer, index) => (
                      <div key={customer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {getInitials(customer.name)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-card-foreground">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.orders} objednávek</div>
                          </div>
                        </div>
                        <div className="font-medium text-card-foreground">{customer.totalSpent}</div>
                      </div>
                    ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    Žádní zákazníci
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Nedávní zákazníci</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customers && customers.filter((customer) => customer.status === "new").length > 0 ? (
                  customers
                    .filter((customer) => customer.status === "new")
                    .slice(0, 3)
                    .map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-800">
                              {getInitials(customer.name)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-card-foreground">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">Připojil se {customer.joinDate}</div>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 border-0">Nový</Badge>
                      </div>
                    ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    Žádní noví zákazníci
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
    </div>
  )
}
