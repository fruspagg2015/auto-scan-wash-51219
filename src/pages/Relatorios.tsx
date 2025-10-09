import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer 
} from "recharts"
import { 
  Calendar, 
  Download, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Car,
  Clock,
  Filter
} from "lucide-react"

// Mock data para relatórios
const vendasMensais = [
  { mes: "Jan", vendas: 15000, atendimentos: 120 },
  { mes: "Fev", vendas: 18000, atendimentos: 145 },
  { mes: "Mar", vendas: 22000, atendimentos: 180 },
  { mes: "Abr", vendas: 19000, atendimentos: 155 },
  { mes: "Mai", vendas: 25000, atendimentos: 200 },
  { mes: "Jun", vendas: 28000, atendimentos: 220 }
]

const servicosMaisVendidos = [
  { nome: "Lavagem Completa", vendas: 450, receita: 11250, color: "hsl(var(--wash-blue))" },
  { nome: "Lavagem Simples", vendas: 320, receita: 4800, color: "hsl(var(--wash-green))" },
  { nome: "Enceramento", vendas: 180, receita: 6300, color: "hsl(var(--wash-orange))" },
  { nome: "Detalhamento", vendas: 95, receita: 9500, color: "hsl(var(--primary))" }
]

const performanceDiaria = [
  { dia: "Dom", carros: 25, receita: 625 },
  { dia: "Seg", carros: 45, receita: 1125 },
  { dia: "Ter", carros: 40, receita: 1000 },
  { dia: "Qua", carros: 42, receita: 1050 },
  { dia: "Qui", carros: 48, receita: 1200 },
  { dia: "Sex", carros: 55, receita: 1375 },
  { dia: "Sab", carros: 35, receita: 875 }
]

const topClientes = [
  { id: 1, nome: "João Silva", visitas: 12, gasto: 450.00, ultimaVisita: "2024-01-20" },
  { id: 2, nome: "Empresa ABC", visitas: 8, gasto: 1200.00, ultimaVisita: "2024-01-18" },
  { id: 3, nome: "Maria Santos", visitas: 10, gasto: 380.00, ultimaVisita: "2024-01-15" },
  { id: 4, nome: "Carlos Lima", visitas: 7, gasto: 290.00, ultimaVisita: "2024-01-12" }
]

export default function Relatorios() {
  const [periodoInicio, setPeriodoInicio] = useState("")
  const [periodoFim, setPeriodoFim] = useState("")
  const [tipoRelatorio, setTipoRelatorio] = useState("vendas")

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const exportarRelatorio = () => {
    console.log("Exportando relatório...")
    // Implementar lógica de exportação
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho e relatórios detalhados</p>
        </div>
        
        <Button onClick={exportarRelatorio} className="bg-primary hover:bg-primary/90">
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="servicos">Serviços</SelectItem>
                  <SelectItem value="clientes">Clientes</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inicio">Data Início</Label>
              <Input
                id="inicio"
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fim">Data Fim</Label>
              <Input
                id="fim"
                type="date"
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs do Período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Faturamento Total</p>
                <p className="text-lg font-semibold">R$ 127.850</p>
                <p className="text-xs text-green-600">+12% vs mês anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Car className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carros Atendidos</p>
                <p className="text-lg font-semibold">1.020</p>
                <p className="text-xs text-green-600">+8% vs mês anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-lg font-semibold">R$ 125,34</p>
                <p className="text-xs text-green-600">+3% vs mês anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
                <p className="text-lg font-semibold">38 min</p>
                <p className="text-xs text-red-600">+2min vs mês anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com diferentes relatórios */}
      <Tabs defaultValue="vendas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vendas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vendas Mensais</CardTitle>
                <CardDescription>Evolução do faturamento nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    vendas: { label: "Vendas", color: "hsl(var(--primary))" }
                  }}
                  className="h-[200px] w-full"
                >
                  <LineChart data={vendasMensais}>
                    <XAxis dataKey="mes" fontSize={12} />
                    <YAxis fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="vendas" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Atendimentos Mensais</CardTitle>
                <CardDescription>Número de carros atendidos por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    atendimentos: { label: "Atendimentos", color: "hsl(var(--wash-blue))" }
                  }}
                  className="h-[200px] w-full"
                >
                  <BarChart data={vendasMensais}>
                    <XAxis dataKey="mes" fontSize={12} />
                    <YAxis fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="atendimentos" fill="hsl(var(--wash-blue))" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Serviços Mais Vendidos</CardTitle>
                <CardDescription>Distribuição por tipo de serviço</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    vendas: { label: "Vendas" }
                  }}
                  className="h-[200px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={servicosMaisVendidos}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="vendas"
                    >
                      {servicosMaisVendidos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranking de Serviços</CardTitle>
                <CardDescription>Por quantidade e receita</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {servicosMaisVendidos.map((servico, index) => (
                    <div key={servico.nome} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: servico.color }} />
                        <div>
                          <p className="font-medium text-sm">{servico.nome}</p>
                          <p className="text-xs text-muted-foreground">{servico.vendas} vendas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatPrice(servico.receita)}</p>
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Clientes</CardTitle>
              <CardDescription>Clientes com maior volume de negócios</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Visitas</TableHead>
                    <TableHead>Total Gasto</TableHead>
                    <TableHead>Última Visita</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClientes.map((cliente, index) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{cliente.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>{cliente.visitas}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatPrice(cliente.gasto)}
                      </TableCell>
                      <TableCell>{cliente.ultimaVisita}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={cliente.visitas > 10 ? "default" : "secondary"}
                          className={cliente.visitas > 10 ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {cliente.visitas > 10 ? "VIP" : "Regular"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Diária</CardTitle>
              <CardDescription>Média de carros e receita por dia da semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  carros: { label: "Carros", color: "hsl(var(--wash-blue))" },
                  receita: { label: "Receita", color: "hsl(var(--wash-green))" }
                }}
                className="h-[300px] w-full"
              >
                <BarChart data={performanceDiaria}>
                  <XAxis dataKey="dia" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="carros" fill="hsl(var(--wash-blue))" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}