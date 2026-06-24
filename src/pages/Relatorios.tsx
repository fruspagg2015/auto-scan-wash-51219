import { useState, useEffect } from "react"
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
  Cell 
} from "recharts"
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Car,
  Clock,
  Filter,
  Loader2
} from "lucide-react"
import { getRelatoriosDataApi, APIRelatoriosData } from "@/services/clientApi"

export default function Relatorios() {
  // Obter o primeiro dia do mês atual (ex: 2026-06-01) e a data de hoje (ex: 2026-06-24)
  const getPrimeiroDiaMes = () => {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}-01`;
  };

  const getHoje = () => {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [periodoInicio, setPeriodoInicio] = useState(getPrimeiroDiaMes())
  const [periodoFim, setPeriodoFim] = useState(getHoje())
  const [tipoRelatorio, setTipoRelatorio] = useState("vendas")
  const [data, setData] = useState<APIRelatoriosData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const fetchRelatorios = async () => {
    try {
      setIsLoading(true);
      const res = await getRelatoriosDataApi(periodoInicio, periodoFim);
      setData(res);
    } catch (e) {
      console.error("Erro ao buscar dados do relatório:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatorios();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho e relatórios detalhados</p>
        </div>
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
              <Button onClick={fetchRelatorios} disabled={isLoading} variant="outline" className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Carregando dados dos relatórios...</p>
        </div>
      ) : (
        <>
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
                    <p className="text-lg font-semibold">{formatPrice(data?.resumo.faturamento_total ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
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
                    <p className="text-lg font-semibold">{data?.resumo.carros_atendidos ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
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
                    <p className="text-lg font-semibold">{formatPrice(data?.resumo.ticket_medio ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Média por atendimento</p>
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
                    <p className="text-lg font-semibold">{data?.resumo.tempo_medio ? Math.round(data.resumo.tempo_medio) : 0} min</p>
                    <p className="text-xs text-muted-foreground mt-1">Média por veículo</p>
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
                    <CardDescription>Evolução do faturamento no período</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!data?.vendas_por_mes || data.vendas_por_mes.length === 0) ? (
                      <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                        Nenhuma venda registrada no período
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          vendas: { label: "Vendas", color: "hsl(var(--primary))" }
                        }}
                        className="h-[200px] w-full"
                      >
                        <LineChart data={data.vendas_por_mes.map(v => ({ mes: v.mes, vendas: v.total }))}>
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
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Atendimentos Mensais</CardTitle>
                    <CardDescription>Número de carros atendidos no período</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!data?.atendimentos_mensais || data.atendimentos_mensais.length === 0) ? (
                      <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                        Nenhum atendimento registrado no período
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          atendimentos: { label: "Atendimentos", color: "hsl(var(--wash-blue))" }
                        }}
                        className="h-[200px] w-full"
                      >
                        <BarChart data={data.atendimentos_mensais.map(a => ({ mes: a.mes, atendimentos: a.quantidade }))}>
                          <XAxis dataKey="mes" fontSize={12} />
                          <YAxis fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="atendimentos" fill="hsl(var(--wash-blue))" radius={4} />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="servicos" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Serviços Mais Vendidos</CardTitle>
                    <CardDescription>Distribuição por quantidade de serviços</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!data?.servicos_mais_vendidos || data.servicos_mais_vendidos.length === 0) ? (
                      <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                        Nenhum serviço registrado no período
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          vendas: { label: "Vendas" }
                        }}
                        className="h-[200px] w-full"
                      >
                        <PieChart>
                          <Pie
                            data={(() => {
                              const colors = [
                                "hsl(var(--wash-blue))",
                                "hsl(var(--wash-green))",
                                "hsl(var(--wash-orange))",
                                "hsl(var(--primary))",
                                "hsl(var(--accent))"
                              ];
                              return data.servicos_mais_vendidos.map((s, idx) => ({
                                nome: s.descricao,
                                vendas: s.quantidade,
                                color: colors[idx % colors.length]
                              }));
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="vendas"
                          >
                            {data.servicos_mais_vendidos.map((entry, index) => {
                              const colors = [
                                "hsl(var(--wash-blue))",
                                "hsl(var(--wash-green))",
                                "hsl(var(--wash-orange))",
                                "hsl(var(--primary))",
                                "hsl(var(--accent))"
                              ];
                              return (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              );
                            })}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Ranking de Serviços</CardTitle>
                    <CardDescription>Por quantidade e receita</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!data?.ranking_servicos || data.ranking_servicos.length === 0) ? (
                      <div className="text-muted-foreground text-sm py-4">Nenhum serviço no ranking</div>
                    ) : (
                      <div className="space-y-4">
                        {data.ranking_servicos.map((servico, index) => {
                          const colors = [
                            "hsl(var(--wash-blue))",
                            "hsl(var(--wash-green))",
                            "hsl(var(--wash-orange))",
                            "hsl(var(--primary))",
                            "hsl(var(--accent))"
                          ];
                          return (
                            <div key={servico.descricao} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                                <div>
                                  <p className="font-medium text-sm">{servico.descricao}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">{formatPrice(servico.total)}</p>
                                <Badge variant="secondary" className="text-xs">
                                  #{index + 1}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clientes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Clientes</CardTitle>
                  <CardDescription>Clientes com maior volume de negócios no período</CardDescription>
                </CardHeader>
                <CardContent>
                  {(!data?.top_clientes || data.top_clientes.length === 0) ? (
                    <div className="text-muted-foreground text-sm py-8 text-center">Nenhum cliente registrado no período</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Atendimentos</TableHead>
                          <TableHead>Total Gasto</TableHead>
                          <TableHead>Última Visita</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.top_clientes.map((cliente, index) => (
                          <TableRow key={cliente.nome}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                                  {index + 1}
                                </Badge>
                                <span className="font-medium">{cliente.nome}</span>
                              </div>
                            </TableCell>
                            <TableCell>{cliente.atendimentos}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatPrice(cliente.total)}
                            </TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>
                              <Badge 
                                variant={cliente.atendimentos > 10 ? "default" : "secondary"}
                                className={cliente.atendimentos > 10 ? "bg-green-500 hover:bg-green-600" : ""}
                              >
                                {cliente.atendimentos > 10 ? "VIP" : "Regular"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Diária</CardTitle>
                  <CardDescription>Média de carros e receita por dia da semana no período</CardDescription>
                </CardHeader>
                <CardContent>
                  {(!data?.performance_diaria || data.performance_diaria.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm">
                      Nenhuma performance diária registrada no período
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        carros: { label: "Carros", color: "hsl(var(--wash-blue))" },
                        receita: { label: "Receita", color: "hsl(var(--wash-green))" }
                      }}
                      className="h-[300px] w-full"
                    >
                      <BarChart data={(() => {
                        const mapDia = (dia: string) => {
                          const dias: Record<string, string> = {
                            'Mon': 'Seg',
                            'Tue': 'Ter',
                            'Wed': 'Qua',
                            'Thu': 'Qui',
                            'Fri': 'Sex',
                            'Sat': 'Sáb',
                            'Sun': 'Dom'
                          };
                          return dias[dia] || dia;
                        };
                        return data.performance_diaria.map(p => ({
                          dia: mapDia(p.dia),
                          carros: p.quantidade,
                          receita: p.receita
                        }));
                      })()}>
                        <XAxis dataKey="dia" fontSize={12} />
                        <YAxis fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="carros" fill="hsl(var(--wash-blue))" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}