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

// Mock data
const dailyStats = [
  { day: "Seg", carros: 8, receita: 320 },
  { day: "Ter", carros: 12, receita: 480 },
  { day: "Qua", carros: 15, receita: 600 },
  { day: "Qui", carros: 10, receita: 400 },
  { day: "Sex", carros: 18, receita: 720 },
  { day: "Sáb", carros: 25, receita: 1000 },
  { day: "Dom", carros: 20, receita: 800 },
];

const serviceData = [
  { name: "Lavagem Simples", value: 45, color: "hsl(var(--wash-blue))" },
  { name: "Lavagem Completa", value: 30, color: "hsl(var(--wash-green))" },
  { name: "Enceramento", value: 15, color: "hsl(var(--wash-blue-light))" },
  { name: "Detalhamento", value: 10, color: "hsl(var(--accent))" },
];

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

const vehiclesInServiceInitial: VehicleInService[] = [
  {
    id: 1,
    placa: "ABC-1234",
    modelo: "Fiat Uno",
    cor: "Prata",
    servico: "Lavagem Completa",
    status: "Em andamento",
    horaChegada: "14:23",
    tempoEstimado: "25 min",
    tipoAtendimento: "fila"
  },
  {
    id: 2,
    placa: "XYZ-5678",
    modelo: "Honda Civic",
    cor: "Preto",
    servico: "Lavagem + Cera",
    status: "Aguardando",
    horaChegada: "14:45",
    tempoEstimado: "40 min",
    tipoAtendimento: "fila"
  },
  {
    id: 3,
    placa: "DEF-9012",
    modelo: "Toyota Corolla",
    cor: "Branco",
    servico: "Detalhamento",
    status: "Finalizado",
    horaChegada: "13:30",
    tempoEstimado: "-",
    tipoAtendimento: "agendado"
  },
];

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

  useEffect(() => {
    // Verificar se há novo agendamento vindo da tela de detalhes
    if (location.state?.novoAgendamento) {
      const novoAgendamento = location.state.novoAgendamento;
      
      const novoVeiculo = {
        id: novoAgendamento.id,
        placa: novoAgendamento.placa,
        modelo: `${novoAgendamento.marca || ''} ${novoAgendamento.modelo}`.trim(),
        cor: novoAgendamento.cor,
        servico: novoAgendamento.servicosNomes,
        status: novoAgendamento.status,
        horaChegada: novoAgendamento.tipoAtendimento === 'agendado' 
          ? new Date(novoAgendamento.dataAgendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : novoAgendamento.horaChegada,
        tempoEstimado: `${novoAgendamento.tempoEstimado} min`,
        tipoAtendimento: novoAgendamento.tipoAtendimento,
        dataAgendamento: novoAgendamento.dataAgendamento
      };

      setVehiclesInService(prev => {
        const novosVeiculos = [...prev, novoVeiculo];
        // Ordenar: agendados primeiro (por horário), depois fila (por ordem de chegada)
        return novosVeiculos.sort((a, b) => {
          if (a.tipoAtendimento === 'agendado' && b.tipoAtendimento === 'fila') return -1;
          if (a.tipoAtendimento === 'fila' && b.tipoAtendimento === 'agendado') return 1;
          
          if (a.tipoAtendimento === 'agendado' && b.tipoAtendimento === 'agendado') {
            const timeA = a.dataAgendamento ? new Date(a.dataAgendamento).getTime() : 0;
            const timeB = b.dataAgendamento ? new Date(b.dataAgendamento).getTime() : 0;
            return timeA - timeB;
          }
          
          return a.id - b.id; // Ordem de chegada para fila
        });
      });

      // Limpar o state para evitar duplicação
      window.history.replaceState({}, document.title);
    }

    // Carregar agendamentos do localStorage
    const agendamentosSalvos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
    if (agendamentosSalvos.length > 0) {
      const veiculosDoStorage = agendamentosSalvos.map((agendamento: any) => ({
        id: agendamento.id,
        placa: agendamento.placa,
        modelo: `${agendamento.marca || ''} ${agendamento.modelo}`.trim(),
        cor: agendamento.cor,
        servico: agendamento.servicosNomes,
        status: agendamento.status,
        horaChegada: agendamento.tipoAtendimento === 'agendado' 
          ? new Date(agendamento.dataAgendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : agendamento.horaChegada,
        tempoEstimado: `${agendamento.tempoEstimado} min`,
        tipoAtendimento: agendamento.tipoAtendimento,
        dataAgendamento: agendamento.dataAgendamento
      }));

      setVehiclesInService(prev => {
        const novosVeiculos = [...vehiclesInServiceInitial, ...veiculosDoStorage];
        return novosVeiculos.sort((a, b) => {
          if (a.tipoAtendimento === 'agendado' && b.tipoAtendimento === 'fila') return -1;
          if (a.tipoAtendimento === 'fila' && b.tipoAtendimento === 'agendado') return 1;
          
          if (a.tipoAtendimento === 'agendado' && b.tipoAtendimento === 'agendado') {
            const timeA = a.dataAgendamento ? new Date(a.dataAgendamento).getTime() : 0;
            const timeB = b.dataAgendamento ? new Date(b.dataAgendamento).getTime() : 0;
            return timeA - timeB;
          }
          
          return a.id - b.id;
        });
      });
    }
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
                  <h3 className="text-2xl sm:text-3xl font-bold text-wash-blue">12</h3>
                  <p className="text-xs text-wash-green mt-1">+3 vs ontem</p>
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
                  <h3 className="text-2xl sm:text-3xl font-bold text-wash-green">R$ 480</h3>
                  <p className="text-xs text-wash-green mt-1">+12% vs ontem</p>
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
                  <h3 className="text-2xl sm:text-3xl font-bold text-amber-600">3</h3>
                  <p className="text-xs text-muted-foreground mt-1">2 aguardando</p>
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
                  <h3 className="text-2xl sm:text-3xl font-bold text-wash-blue">32min</h3>
                  <p className="text-xs text-wash-green mt-1">-5min vs média</p>
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
                <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
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
              <ChartContainer
                config={{
                  services: { label: "Serviços" },
                }}
                className="h-[200px] sm:h-[280px]"
              >
                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {serviceData.map((item, index) => (
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
                        <div className="text-sm text-muted-foreground">{vehicle.cor}</div>
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
                          {vehicle.modelo} • {vehicle.cor}
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