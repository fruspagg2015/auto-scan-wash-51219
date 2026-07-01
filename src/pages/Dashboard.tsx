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
import { listVehiclesInServiceApi, getDashboardDataApi, listServicesApi, APIDashboardData } from "@/services/clientApi";
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
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

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
  entrada?: string;
  minutos?: number;
  idplaca?: number;
  cliente?: {
    id?: number;
    idcliente?: number;
    nome: string;
    telefone: string;
    email?: string;
    cadastrado: boolean;
  };
}

const parseDatabaseDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  if (dateStr.includes('Z') || (dateStr.includes('-') && dateStr.includes('T'))) {
    return new Date(dateStr);
  }
  const formatted = dateStr.replace(' ', 'T');
  return new Date(`${formatted}Z`);
};

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

const VehicleTimer = ({ entrada, minutos }: { entrada?: string; minutos?: number }) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [isOvertime, setIsOvertime] = useState<boolean>(false);

  useEffect(() => {
    if (!entrada || !minutos) {
      setTimeLeftStr("-");
      return;
    }

    const start = parseDatabaseDate(entrada).getTime();
    const durationMs = minutos * 60 * 1000;
    const target = start + durationMs;

    const formatTime = (totalSeconds: number): string => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
      ].join(':');
    };

    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff > 0) {
        // Dentro do tempo: mostra HH:MM:SS restante
        const totalSecs = Math.floor(diff / 1000);
        setTimeLeftStr(formatTime(totalSecs));
        setIsOvertime(false);
      } else {
        // Tempo esgotado: mostra tempo ultrapassado como -HH:MM:SS
        const absDiff = Math.abs(diff);
        const totalSecs = Math.floor(absDiff / 1000);
        setTimeLeftStr(`-${formatTime(totalSecs)}`);
        setIsOvertime(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [entrada, minutos]);

  if (!entrada || !minutos) return <span>-</span>;

  return (
    <span className={cn(
      "font-mono font-bold text-xs tracking-wider px-2 py-0.5 rounded shadow-sm transition-all duration-300",
      isOvertime 
        ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 animate-pulse font-extrabold text-[13px]" 
        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
    )}>
      {timeLeftStr}
    </span>
  );
};
const VehicleCard = ({ 
  vehicle, 
  navigate,
  getStatusBadge
}: { 
  vehicle: VehicleInService; 
  navigate: any;
  getStatusBadge: (status: string) => React.ReactNode;
}) => {
  return (
    <Card className="border border-border/80 shadow-md hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-white to-slate-50/40 dark:from-slate-900 dark:to-slate-950/40 transition-all duration-300 h-full flex flex-col justify-between min-h-[220px] overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-1 h-full bg-wash-blue/80 group-hover:bg-wash-blue transition-colors duration-300" />
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div>
          {/* Top Header Row */}
          <div className="flex items-start justify-between mb-3 gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono font-bold text-base tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 shadow-sm whitespace-nowrap group-hover:border-wash-blue/30 transition-colors duration-300">
                  {vehicle.placa}
                </span>
                {vehicle.tipoAtendimento === 'agendado' && (
                  <Badge variant="outline" className="border-wash-blue text-wash-blue bg-wash-blue/5 text-[10px] py-0.5 px-1.5 font-semibold flex-shrink-0">
                    <Calendar className="h-2.5 w-2.5 mr-1" />
                    Agendado
                  </Badge>
                )}
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mt-2">
                <Car className="h-4 w-4 text-slate-500 flex-shrink-0 group-hover:text-wash-blue transition-colors duration-300" />
                <span className="truncate max-w-[150px]">{vehicle.modelo}</span>
                {vehicle.cor && (
                  <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
                    ({vehicle.cor})
                  </span>
                )}
              </div>
            </div>
            
            {/* Dropdown Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border border-border/80 z-50">
                <DropdownMenuItem onClick={() => navigate("/vehicle-details", { state: vehicle })} className="cursor-pointer">
                  Ver Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Finalizar</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer">Cancelar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
 
          {/* Services List Tag style */}
          <div className="mb-4">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Serviços:</div>
            <div className="flex flex-wrap gap-1">
              {vehicle.servico.split(',').map((serv, index) => (
                <span 
                  key={index}
                  className="text-[11px] font-semibold bg-wash-blue/10 text-wash-blue px-2.5 py-0.5 rounded-full border border-wash-blue/10 shadow-sm"
                >
                  {serv.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
 
        {/* Footer Info Row */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Status:</span>
            </div>
            {getStatusBadge(vehicle.status)}
          </div>
 
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Chegada:</span>
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{vehicle.horaChegada}</span>
          </div>
 
          {vehicle.minutos !== undefined && vehicle.minutos > 0 ? (
            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40">
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Tempo restante:</span>
              </div>
              <VehicleTimer entrada={vehicle.entrada} minutos={vehicle.minutos} />
            </div>
          ) : vehicle.tempoEstimado !== "-" ? (
            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40">
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Tempo estimado:</span>
              </div>
              <span className="font-bold text-amber-600 dark:text-amber-400">{vehicle.tempoEstimado}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
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
    "#3b82f6", // Azul vibrante
    "#10b981", // Verde esmeralda
    "#f59e0b", // Âmbar/Amarelo
    "#8b5cf6", // Roxo elétrico
    "#ec4899", // Rosa brilhante
    "#06b6d4", // Ciano tecnológico
    "#f97316", // Laranja energia
    "#14b8a6", // Turquesa
    "#6366f1", // Índigo
    "#a855f7", // Violeta
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
        // Busca os dados do dashboard e a lista de serviços do cadastro em paralelo
        const [data, servicesData] = await Promise.all([
          getDashboardDataApi(),
          listServicesApi().catch((err) => {
            console.error('Error fetching services from registry:', err);
            return [];
          })
        ]);
        
        if (data) {
          setDashboardData(data);
          
          // Mapeia idservico -> tempoestimado
          const serviceDurationMap = new Map<number, number>();
          (servicesData || []).forEach((s) => {
            serviceDurationMap.set(s.idservico, s.tempoestimado || 0);
          });

          let formattedVehicles: VehicleInService[] = (data.cliente_ematendimento?.lista || []).map((order) => {
            // Calcula o tempo que o serviço demanda baseado no cadastro (multiplicando pela quantidade)
            let totalMinutesFromRegistry = order.servicos?.reduce((acc: number, s: any) => {
              const duration = serviceDurationMap.get(s.idservico) || 0;
              const qty = s.quantidade || 1;
              return acc + (duration * qty);
            }, 0) || 0;

            // Fallback caso não encontre duração no cadastro para os serviços vinculados
            if (totalMinutesFromRegistry === 0 && order.minutos) {
              totalMinutesFromRegistry = order.minutos;
            }

            return {
              id: order.idlavagem,
              placa: order.veiculo?.placa || 'N/A',
              modelo: `${order.veiculo?.marca || ''} ${order.veiculo?.modelo || ''}`.trim() || 'N/A',
              cor: order.veiculo?.cor && order.veiculo.cor !== '-' ? order.veiculo.cor : '',
              servico: order.servicos?.map((s: any) => s.nome).join(', ') || 'N/A',
              status: mapStatus(order.status),
              horaChegada: parseDatabaseDate(order.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              tempoEstimado: totalMinutesFromRegistry ? `${totalMinutesFromRegistry} min` : '-',
              tipoAtendimento: 'fila',
              entrada: order.entrada,
              minutos: totalMinutesFromRegistry,
              idplaca: order.veiculo?.idveiculo || order.veiculo?.idplaca || order.veiculo?.id || 0,
              cliente: order.cliente ? {
                id: order.cliente.idcliente || (order.cliente as any).id || 0,
                idcliente: order.cliente.idcliente || (order.cliente as any).id || 0,
                nome: order.cliente.nome,
                telefone: order.cliente.telefone,
                cadastrado: true
              } : undefined
            };
          });

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
                dataAgendamento: novoAgendamento.dataAgendamento,
                entrada: novoAgendamento.tipoAtendimento === 'agendado' ? novoAgendamento.dataAgendamento : new Date().toISOString(),
                minutos: Number(novoAgendamento.tempoEstimado) || 0
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
          <Card className="shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-wash-blue/10 bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-wash-blue/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:bg-wash-blue/10 transition-colors duration-500" />
            <CardContent className="p-3 sm:p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Carros Hoje</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-wash-blue mt-1">
                    {isLoading ? "..." : dashboardData?.resumo.carros_hoje ?? 0}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-wash-green font-semibold mt-1">Total hoje</p>
                </div>
                <div className="p-2 sm:p-3 bg-wash-blue/10 rounded-xl text-wash-blue group-hover:scale-110 transition-transform duration-300">
                  <Car className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-wash-green/10 bg-gradient-to-br from-white to-green-50/20 dark:from-slate-900 dark:to-green-950/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-wash-green/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:bg-wash-green/10 transition-colors duration-500" />
            <CardContent className="p-3 sm:p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receita Hoje</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-wash-green mt-1">
                    {isLoading ? "..." : `R$ ${dashboardData?.resumo.receitas_hoje ?? 0}`}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-wash-green font-semibold mt-1">Total faturado</p>
                </div>
                <div className="p-2 sm:p-3 bg-wash-green/10 rounded-xl text-wash-green group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-amber-500/10 bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:bg-amber-500/10 transition-colors duration-500" />
            <CardContent className="p-3 sm:p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Em Atendimento</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                    {isLoading ? "..." : dashboardData?.resumo.em_atendimento ?? 0}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold mt-1">Veículos ativos</p>
                </div>
                <div className="p-2 sm:p-3 bg-amber-500/10 rounded-xl text-amber-600 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-wash-blue/10 bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-wash-blue/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:bg-wash-blue/10 transition-colors duration-500" />
            <CardContent className="p-3 sm:p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tempo Médio</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-wash-blue mt-1">
                    {isLoading ? "..." : `${dashboardData?.resumo.tempo_medio ? Math.round(dashboardData.resumo.tempo_medio) : 0}min`}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-wash-green font-semibold mt-1">Tempo médio/veículo</p>
                </div>
                <div className="p-2 sm:p-3 bg-wash-blue/10 rounded-xl text-wash-blue group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
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
            {vehiclesInService.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                <Car className="h-10 w-10 text-muted-foreground/60 mb-2 stroke-[1.5]" />
                <p className="font-medium text-sm">Nenhum veículo em atendimento</p>
                <p className="text-xs text-muted-foreground/80 mt-1">Todos os veículos foram concluídos ou não há registros no momento.</p>
              </div>
            ) : (
              <>
                {/* Desktop Grid of Cards */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {vehiclesInService.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} navigate={navigate} getStatusBadge={getStatusBadge} />
                  ))}
                </div>

                {/* Mobile Cards Carousel */}
                <div className="md:hidden">
                  <Carousel opts={{ align: "start" }} className="w-full">
                    <CarouselContent className="-ml-2">
                      {vehiclesInService.map((vehicle) => (
                        <CarouselItem key={vehicle.id} className="pl-2 basis-[85%] sm:basis-[70%]">
                          <VehicleCard vehicle={vehicle} navigate={navigate} getStatusBadge={getStatusBadge} />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;