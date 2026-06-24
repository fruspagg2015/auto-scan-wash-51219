import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Car,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Camera,
  CheckCircle,
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listVehiclesInServiceApi, getDashboardDataApi, APIDashboardData } from "@/services/clientApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";

// Mapeamento dinâmico dos dados do dashboard do backend

interface VehicleInService {
  id: number;
  placa: string;
  modelo: string;
  cor: string;
  servico: string;
  status: string;
  horaChegada: string;
  tempoEstimado: string;
  tipoAtendimento: 'fila' | 'agendado';
  dataAgendamento?: string;
}


const vehiclesInServiceInitial: VehicleInService[] = [];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Em andamento":
      return <Badge className="bg-wash-blue/20 text-wash-blue border-wash-blue/30">{status}</Badge>;
    case "Aguardando":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">{status}</Badge>;
    case "Finalizado":
      return <Badge className="bg-wash-green/20 text-wash-green border-wash-green/30">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState("hoje");
  const [vehiclesInService, setVehiclesInService] = useState<VehicleInService[]>(vehiclesInServiceInitial);
  const [dashboardData, setDashboardData] = useState<APIDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const chartData = dashboardData
    ? (dashboardData.performance_semanal || []).map((item) => ({
        day: mapDia(item.dia),
        carros: item.quantidade,
        receita: item.receita
      }))
    : [];

  const colors = [
    "hsl(var(--wash-blue))",
    "hsl(var(--wash-green))",
    "hsl(var(--wash-blue-light))",
    "hsl(var(--accent))",
    "hsl(var(--warning))"
  ];

  const pieChartData = dashboardData
    ? (dashboardData.distribuicao_servicos || []).map((item, idx) => ({
        name: item.servico,
        value: Number(item.percentual.toFixed(1)),
        color: colors[idx % colors.length]
      }))
    : [];

  const mapStatus = (dbStatus: string) => {
    const map: Record<string, string> = {
      'pending': 'Aguardando',
      'in_progress': 'Em andamento',
      'completed': 'Finalizado',
      'delivered': 'Entregue',
      'ABERTA': 'Em andamento'
    };
    return map[dbStatus] || dbStatus;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardDataApi();
        
        if (data) {
          setDashboardData(data);
          
          let formattedVehicles: VehicleInService[] = (data.cliente_ematendimento?.lista || []).map((order) => ({
            id: order.idlavagem,
            placa: order.veiculo?.placa || 'N/A',
            modelo: `${order.veiculo?.marca || ''} ${order.veiculo?.modelo || ''}`.trim() || 'N/A',
            cor: order.veiculo?.cor && order.veiculo.cor !== '-' ? order.veiculo.cor : '',
            servico: order.servicos?.map((s: any) => s.nome).join(', ') || 'N/A',
            status: mapStatus(order.status),
            horaChegada: new Date(order.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            tempoEstimado: order.minutos ? `${order.minutos} min` : '-',
            tipoAtendimento: 'fila'
          }));

          // Se houver novo agendamento de localState que por algum motivo não carregou da API
          if (location.state?.novoAgendamento) {
            const novoAgendamento = location.state.novoAgendamento;
            const existe = formattedVehicles.some(v => v.id === novoAgendamento.id);
            if (!existe) {
              const novoVeiculo: VehicleInService = {
                id: novoAgendamento.id,
                placa: novoAgendamento.placa,
                modelo: `${novoAgendamento.marca || ''} ${novoAgendamento.modelo}`.trim(),
                cor: novoAgendamento.cor && novoAgendamento.cor !== '-' ? novoAgendamento.cor : '',
                servico: novoAgendamento.servicosNomes,
                status: novoAgendamento.status,
                horaChegada: novoAgendamento.tipoAtendimento === 'agendado'
                  ? new Date(novoAgendamento.dataAgendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  : novoAgendamento.horaChegada,
                tempoEstimado: `${novoAgendamento.tempoEstimado} min`,
                tipoAtendimento: novoAgendamento.tipoAtendimento,
                dataAgendamento: novoAgendamento.dataAgendamento
              };
              formattedVehicles = [...formattedVehicles, novoVeiculo];
            }
            // Limpar o state para evitar duplicação
            window.history.replaceState({}, document.title);
          }

          // Ordenar veículos
          formattedVehicles.sort((a, b) => {
            if (a.tipoAtendimento === 'agendado' && b.tipoAtendimento === 'fila') return -1;
            if (a.tipoAtendimento === 'fila' && b.tipoAtendimento === 'agendado') return 1;
            if (a.tipoAtendimento === 'agendado' && b.tipoAtendimento === 'agendado') {
              const timeA = a.dataAgendamento ? new Date(a.dataAgendamento).getTime() : 0;
              const timeB = b.dataAgendamento ? new Date(b.dataAgendamento).getTime() : 0;
              return timeA - timeB;
            }
            return a.id - b.id;
          });

          setVehiclesInService(formattedVehicles);
        }
      } catch (err) {
        console.error('Unexpected error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [location.state]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-wash-blue-light/20 to-background min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="shadow-wash">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Carros Hoje</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-wash-blue">
                    {isLoading ? "..." : dashboardData?.resumo.carros_hoje ?? 0}
                  </h3>
                  <p className="text-xs text-wash-green mt-1">Total hoje</p>
                </div>
                <Car className="h-6 w-6 sm:h-8 sm:w-8 text-wash-blue/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-wash">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Receita Hoje</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-wash-green">
                    {isLoading ? "..." : `R$ ${dashboardData?.resumo.receitas_hoje ?? 0}`}
                  </h3>
                  <p className="text-xs text-wash-green mt-1">Total faturado</p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-wash-green/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-wash">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Em Atendimento</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-amber-600">
                    {isLoading ? "..." : dashboardData?.resumo.em_atendimento ?? 0}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Veículos ativos</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-wash">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Tempo Médio</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-wash-blue">
                    {isLoading ? "..." : `${dashboardData?.resumo.tempo_medio ? Math.round(dashboardData.resumo.tempo_medio) : 0}min`}
                  </h3>
                  <p className="text-xs text-wash-green mt-1">Tempo médio por veículo</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-wash-blue/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Daily Performance Chart */}
          <Card className="shadow-wash">
            <CardHeader>
              <CardTitle className="text-wash-blue flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp className="h-4 w-4" />
                Performance Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  carros: { label: "Carros", color: "hsl(var(--wash-blue))" },
                  receita: { label: "Receita", color: "hsl(var(--wash-green))" },
                }}
                className="h-[200px] sm:h-[280px]"
              >
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <XAxis dataKey="day" fontSize={10} tick={{ fontSize: 10 }} />
                  <YAxis fontSize={10} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="carros" fill="hsl(var(--wash-blue))" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Service Distribution */}
          <Card className="shadow-wash">
            <CardHeader>
              <CardTitle className="text-wash-blue flex items-center gap-2 text-sm sm:text-base">
                <Users className="h-4 w-4" />
                Distribuição de Serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] sm:h-[280px] text-muted-foreground text-sm">
                  Nenhum serviço registrado hoje
                </div>
              ) : (
                <>
                  <ChartContainer
                    config={{
                      services: { label: "Serviços" },
                    }}
                    className="h-[200px] sm:h-[280px]"
                  >
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pieChartData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">{item.name}</span>
                        <span className="text-xs sm:text-sm font-medium ml-auto">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vehicles Section */}
        <Card className="shadow-wash">
          <CardHeader>
            <CardTitle className="text-wash-blue flex items-center gap-2 text-lg sm:text-xl">
              <Car className="h-5 w-5" />
              Veículos em Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chegada</TableHead>
                    <TableHead>Tempo Est.</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehiclesInService.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {vehicle.placa}
                          {vehicle.tipoAtendimento === 'agendado' && (
                            <Badge variant="outline" className="border-wash-blue text-wash-blue text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              Agendado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vehicle.modelo}</div>
                          {vehicle.cor ? (
                            <div className="text-xs text-muted-foreground/80">{vehicle.cor}</div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground/50 italic">Cor não informada</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.servico}</TableCell>
                      <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell>{vehicle.horaChegada}</TableCell>
                      <TableCell>{vehicle.tempoEstimado}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white z-50">
                            <DropdownMenuItem onClick={() => navigate("/vehicle-details", { state: vehicle })}>
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>Finalizar</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {vehiclesInService.map((vehicle) => (
                <Card key={vehicle.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-lg text-wash-blue">{vehicle.placa}</div>
                          {vehicle.tipoAtendimento === 'agendado' && (
                            <Badge variant="outline" className="border-wash-blue text-wash-blue text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              Agendado
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.modelo}
                          {vehicle.cor && (
                            <span className="text-xs text-muted-foreground/70 ml-1.5">
                              • {vehicle.cor}
                            </span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white z-50">
                          <DropdownMenuItem onClick={() => navigate("/vehicle-details", { state: vehicle })}>
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>Finalizar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Serviço:</span>
                        <span className="text-sm font-medium">{vehicle.servico}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        {getStatusBadge(vehicle.status)}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Chegada:</span>
                        <span className="text-sm font-medium">{vehicle.horaChegada}</span>
                      </div>

                      {vehicle.tempoEstimado !== "-" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Tempo estimado:</span>
                          <span className="text-sm font-medium">{vehicle.tempoEstimado}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;