import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Car, Clock, Palette, Hash, Image, User, Phone, Mail, Calendar, CheckCircle2, CalendarCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { listServicesApi, BackendService, addServiceToClientApi } from "@/services/clientApi";
import { useAuth } from "@/contexts/AuthContext";

interface VehicleData {
  placa: string;
  modelo: string;
  marca?: string;
  ano?: string;
  cor: string;
  hora_chegada: string;
  imagem: string;
  idplaca?: number;
  cliente?: {
    id?: number;
    idcliente?: number;
    nome: string;
    telefone: string;
    email?: string;
    cadastrado: boolean;
  };
  fonte?: 'cadastro_local' | 'api_externa' | 'manual';
  horario_agendado?: Date;
  tipo_atendimento?: 'agendado' | 'fila';
}


const VehicleDetails = () => {
  const { currentCompanyId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const vehicleData = location.state as VehicleData;

  const [servicosSelecionados, setServicosSelecionados] = useState<number[]>([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<BackendService[]>([]);
  const [isLoadingServicos, setIsLoadingServicos] = useState(true);
  const [tipoAtendimento, setTipoAtendimento] = useState<'agendado' | 'fila' | ''>('');
  const [dataAgendamento, setDataAgendamento] = useState<Date>();
  const [horaAgendamento, setHoraAgendamento] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("VehicleDetails vehicleData on mount:", vehicleData);
  }, [vehicleData]);

  useEffect(() => {
    const fetchServicos = async () => {
      try {
        const dados = await listServicesApi();
        setServicosDisponiveis(dados);
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar serviços");
      } finally {
        setIsLoadingServicos(false);
      }
    };
    fetchServicos();
  }, []);

  if (!vehicleData) {
    navigate("/");
    return null;
  }

  const handleServicoToggle = (servicoId: number) => {
    setServicosSelecionados(prev =>
      prev.includes(servicoId)
        ? prev.filter(id => id !== servicoId)
        : [...prev, servicoId]
    );
  };

  const calcularTotal = () => {
    return servicosDisponiveis
      .filter(servico => servicosSelecionados.includes(servico.idservico))
      .reduce((total, servico) => total + servico.valor, 0);
  };

  const calcularTempoEstimado = () => {
    return servicosDisponiveis
      .filter(servico => servicosSelecionados.includes(servico.idservico))
      .reduce((total, servico) => total + (servico.tempoestimado || 0), 0);
  };

  const confirmarServicos = async () => {
    if (servicosSelecionados.length === 0) return;
    if (!tipoAtendimento) return;

    const resolvedClienteId = Number(vehicleData.cliente?.id || vehicleData.cliente?.idcliente || 0);
    const resolvedVeiculoId = Number(vehicleData.idplaca || 0);

    setIsSubmitting(true);

    try {
      const servicosPayload = servicosSelecionados.map(idservico => {
        const servicoOriginal = servicosDisponiveis.find(s => s.idservico === idservico);
        return {
          idservico,
          quantidade: 1,
          valor_unitario: servicoOriginal ? servicoOriginal.valor : 0,
          observacao: ""
        };
      });

      let dataAgendamentoStr: string | null = null;
      if (tipoAtendimento === 'agendado' && dataAgendamento && horaAgendamento) {
        const [horas, minutos] = horaAgendamento.split(':').map(Number);
        const dataComHora = new Date(dataAgendamento);
        dataComHora.setHours(horas, minutos, 0, 0);
        dataAgendamentoStr = dataComHora.toISOString();
      }

      await addServiceToClientApi({
        idcliente: resolvedClienteId,
        idveiculo: resolvedVeiculoId,
        tipo_atendimento: tipoAtendimento as 'fila' | 'agendado',
        data_agendamento: dataAgendamentoStr,
        observacao_geral: "",
        servicos: servicosPayload
      });

      toast.success("Serviço(s) confirmado(s) e registrado(s) com sucesso!");
      navigate('/dashboard');

    } catch (error: any) {
      console.error("Erro ao registrar serviço:", error);
      toast.error(error.message || "Erro ao registrar o serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wash-blue-light to-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-wash-blue">
            🚗 Detalhes do Veículo
          </h1>
        </div>



        {/* Vehicle Information */}
        <Card className="mb-6 shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-wash-blue flex items-center gap-2">
              <Car className="h-5 w-5" />
              Informações do Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Placa */}
            <div className="flex items-center justify-between p-3 bg-wash-blue-light/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-wash-blue" />
                <span className="font-medium text-foreground">Placa</span>
              </div>
              <Badge variant="default" className="bg-wash-blue text-white font-mono text-lg px-3 py-1">
                {vehicleData.placa}
              </Badge>
            </div>

            {/* Marca e Modelo */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-wash-blue" />
                <span className="font-medium text-foreground">Veículo</span>
              </div>
              <span className="text-foreground font-medium">
                {vehicleData.marca ? `${vehicleData.marca} ${vehicleData.modelo}` : vehicleData.modelo}
              </span>
            </div>



            {/* Hora de Chegada */}
            <div className="flex items-center justify-between p-3 bg-wash-blue-light/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-wash-blue" />
                <span className="font-medium text-foreground">Chegada</span>
              </div>
              <Badge variant="outline" className="border-wash-green text-wash-green">
                {vehicleData.hora_chegada}
              </Badge>
            </div>


          </CardContent>
        </Card>

        {/* Client Information */}
        {vehicleData.cliente && (
          <Card className="mb-6 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="text-wash-blue flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Cliente
                {vehicleData.cliente.cadastrado && (
                  <Badge variant="secondary" className="bg-wash-green-light text-wash-green text-xs">
                    Cadastrado
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div className="flex items-center justify-between p-3 bg-wash-blue-light/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-wash-blue" />
                  <span className="font-medium text-foreground">Nome</span>
                </div>
                <span className="text-foreground font-medium">{vehicleData.cliente.nome}</span>
              </div>

              {/* Telefone */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-wash-blue" />
                  <span className="font-medium text-foreground">Telefone</span>
                </div>
                <span className="text-foreground font-medium font-mono">{vehicleData.cliente.telefone}</span>
              </div>

              {/* Email */}
              {vehicleData.cliente.email && (
                <div className="flex items-center justify-between p-3 bg-wash-blue-light/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-wash-blue" />
                    <span className="font-medium text-foreground">E-mail</span>
                  </div>
                  <span className="text-foreground font-medium text-sm">{vehicleData.cliente.email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Card */}
        <Card className="mb-6 shadow-soft bg-wash-green-light/20 border-wash-green/30">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-wash-green text-white px-4 py-2 rounded-full font-medium">
                ✅ Veículo Registrado
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                O veículo foi registrado com sucesso no sistema
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seleção de Serviços */}
        <Card className="mb-6 shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-wash-blue flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Selecionar Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingServicos ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wash-blue"></div>
              </div>
            ) : servicosDisponiveis.map((servico) => (
              <div key={servico.idservico} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <Checkbox
                  id={`servico-${servico.idservico}`}
                  checked={servicosSelecionados.includes(servico.idservico)}
                  onCheckedChange={() => handleServicoToggle(servico.idservico)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`servico-${servico.idservico}`}
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      {servico.nome}
                    </label>
                    <Badge variant="secondary" className="text-wash-blue">
                      R$ {servico.valor.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {servico.descricao}
                  </p>
                </div>
              </div>
            ))}

            {/* Total e Tempo Estimado */}
            {servicosSelecionados.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-wash-blue-light/20 rounded-lg border-wash-blue/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">Total:</span>
                    <Badge variant="default" className="bg-wash-blue text-white text-lg px-3 py-1">
                      R$ {calcularTotal().toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tempo estimado:</span>
                    <span className="text-sm font-medium text-wash-blue">
                      {calcularTempoEstimado()} min
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipo de Atendimento */}
        {servicosSelecionados.length > 0 && (
          <Card className="mb-6 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="text-wash-blue flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Tipo de Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={tipoAtendimento} onValueChange={(value) => setTipoAtendimento(value as 'agendado' | 'fila')}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="fila" id="fila" />
                  <div className="flex-1">
                    <Label htmlFor="fila" className="text-sm font-medium cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-wash-blue" />
                        Entrar na fila
                      </div>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Atendimento por ordem de chegada • Estimativa: 20-40 min
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="agendado" id="agendado" />
                  <div className="flex-1">
                    <Label htmlFor="agendado" className="text-sm font-medium cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-wash-blue" />
                        Agendar horário
                      </div>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Escolha data e hora específica • Atendimento garantido
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {/* Seleção de Data e Hora para Agendamento */}
              {tipoAtendimento === 'agendado' && (
                <div className="mt-4 p-4 bg-wash-blue-light/10 rounded-lg space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dataAgendamento && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataAgendamento ? format(dataAgendamento, "dd/MM/yyyy") : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dataAgendamento}
                          onSelect={setDataAgendamento}
                          disabled={(date) => date < new Date() || date.getDay() === 0}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Horário</Label>
                    <select
                      value={horaAgendamento}
                      onChange={(e) => setHoraAgendamento(e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Selecionar horário</option>
                      <option value="08:00">08:00</option>
                      <option value="08:30">08:30</option>
                      <option value="09:00">09:00</option>
                      <option value="09:30">09:30</option>
                      <option value="10:00">10:00</option>
                      <option value="10:30">10:30</option>
                      <option value="11:00">11:00</option>
                      <option value="11:30">11:30</option>
                      <option value="13:00">13:00</option>
                      <option value="13:30">13:30</option>
                      <option value="14:00">14:00</option>
                      <option value="14:30">14:30</option>
                      <option value="15:00">15:00</option>
                      <option value="15:30">15:30</option>
                      <option value="16:00">16:00</option>
                      <option value="16:30">16:30</option>
                      <option value="17:00">17:00</option>
                      <option value="17:30">17:30</option>
                    </select>
                  </div>

                  {dataAgendamento && horaAgendamento && (
                    <div className="p-2 bg-wash-green-light/20 rounded border-wash-green/30">
                      <p className="text-sm text-wash-green font-medium">
                        ✅ Agendado para {format(dataAgendamento, "dd/MM/yyyy")} às {horaAgendamento}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            disabled={
              isSubmitting ||
              servicosSelecionados.length === 0 ||
              !tipoAtendimento ||
              (tipoAtendimento === 'agendado' && (!dataAgendamento || !horaAgendamento))
            }
            variant="wash"
            size="lg"
            className="w-full"
            onClick={confirmarServicos}
          >
            {isSubmitting ? "Registrando..." : `✅ Confirmar Serviço(s) (${servicosSelecionados.length})`}
          </Button>

          <Button
            onClick={() => navigate("/")}
            variant="outline"
            size="lg"
            className="w-full"
          >
            🏠 Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;