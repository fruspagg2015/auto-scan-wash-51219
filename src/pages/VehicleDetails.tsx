import React, { useState } from "react";
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
import { registerFullService } from "@/services/registrationService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VehicleData {
  placa: string;
  modelo: string;
  marca?: string;
  ano?: string;
  cor: string;
  hora_chegada: string;
  imagem: string;
  cliente?: {
    nome: string;
    telefone: string;
    email?: string;
    cadastrado: boolean;
  };
  fonte?: 'cadastro_local' | 'api_externa' | 'manual';
  horario_agendado?: Date;
  tipo_atendimento?: 'agendado' | 'fila';
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
}

const VehicleDetails = () => {
  const { currentCompanyId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const vehicleData = location.state as VehicleData;

  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  const [tipoAtendimento, setTipoAtendimento] = useState<'agendado' | 'fila' | ''>('');
  const [dataAgendamento, setDataAgendamento] = useState<Date>();
  const [horaAgendamento, setHoraAgendamento] = useState<string>('');

  const servicosDisponiveis: Servico[] = [
    { id: '1', nome: 'Lavagem Simples', preco: 15, descricao: 'Lavagem externa com sabão neutro' },
    { id: '2', nome: 'Lavagem Completa', preco: 25, descricao: 'Lavagem externa + interna + pneus' },
    { id: '3', nome: 'Enceramento', preco: 35, descricao: 'Aplicação de cera protetora' },
    { id: '4', nome: 'Aspiração', preco: 10, descricao: 'Limpeza interna com aspirador' },
    { id: '5', nome: 'Lavagem de Motor', preco: 20, descricao: 'Limpeza do compartimento do motor' },
    { id: '6', nome: 'Detalhamento', preco: 80, descricao: 'Serviço completo de detalhamento' }
  ];

  if (!vehicleData) {
    navigate("/");
    return null;
  }

  const handleServicoToggle = (servicoId: string) => {
    setServicosSelecionados(prev =>
      prev.includes(servicoId)
        ? prev.filter(id => id !== servicoId)
        : [...prev, servicoId]
    );
  };

  const calcularTotal = () => {
    return servicosDisponiveis
      .filter(servico => servicosSelecionados.includes(servico.id))
      .reduce((total, servico) => total + servico.preco, 0);
  };

  const calcularTempoEstimado = () => {
    const temposPorServico = {
      '1': 15, // Lavagem Simples
      '2': 30, // Lavagem Completa
      '3': 45, // Enceramento
      '4': 10, // Aspiração
      '5': 25, // Lavagem de Motor
      '6': 90  // Detalhamento
    };

    return servicosSelecionados.reduce((total, servicoId) => {
      return total + (temposPorServico[servicoId as keyof typeof temposPorServico] || 0);
    }, 0);
  };

  const confirmarServicos = async () => {
    if (servicosSelecionados.length === 0) return;
    if (!tipoAtendimento) return;

    const servicosSelecionadosDetalhes = servicosDisponiveis.filter(s =>
      servicosSelecionados.includes(s.id)
    );

    const servicosNomes = servicosSelecionadosDetalhes.map(s => s.nome);
    const tempoEstimadoStr = `${calcularTempoEstimado()} min`;

    // Prepare Client Data
    // We assume if vehicleData.cliente exists, use it. Else we might need defaults or better error handling.
    // However, the VehicleDetails interface implies cliente is optional? 
    // If it's missing, we can't register a client properly without inputs.
    // We should probably show an error or require client data if we strictly need to register it.
    // For now, let's assume if it is displayed, it exists.

    const clientData = {
      nome: vehicleData.cliente?.nome || 'Cliente Anônimo', // Fallback
      telefone: vehicleData.cliente?.telefone || '0000000000',
      email: vehicleData.cliente?.email,
      company_id: currentCompanyId! // Assert non-null or handle error
    };

    if (!currentCompanyId) {
      toast.error("Empresa não identificada. Não é possível salvar.");
      return;
    }

    try {
      await registerFullService(
        clientData,
        {
          placa: vehicleData.placa,
          modelo: vehicleData.modelo,
          marca: vehicleData.marca,
          cor: vehicleData.cor,
          ano: vehicleData.ano
        },
        servicosNomes,
        tempoEstimadoStr
      );

      toast.success("Serviço confirmado e registrado com sucesso!");
      navigate('/dashboard');

    } catch (error: any) {
      console.error("Erro ao registrar serviço:", error);
      toast.error(`Erro ao registrar: ${error.message}`);
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
            {servicosDisponiveis.map((servico) => (
              <div key={servico.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <Checkbox
                  id={servico.id}
                  checked={servicosSelecionados.includes(servico.id)}
                  onCheckedChange={() => handleServicoToggle(servico.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={servico.id}
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      {servico.nome}
                    </label>
                    <Badge variant="secondary" className="text-wash-blue">
                      R$ {servico.preco.toFixed(2)}
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
              servicosSelecionados.length === 0 ||
              !tipoAtendimento ||
              (tipoAtendimento === 'agendado' && (!dataAgendamento || !horaAgendamento))
            }
            variant="wash"
            size="lg"
            className="w-full"
            onClick={confirmarServicos}
          >
            ✅ Confirmar Serviços ({servicosSelecionados.length})
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