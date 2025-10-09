// Update this page (the content is just a fallback if you fail to update the page)

import { Camera, Car, Droplets, Sparkles, CheckCircle, Truck, Clock, User, Phone, DollarSign, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { localDatabase, atualizarStatusVeiculo, VehicleData } from "@/data/mockData";
import { toast } from "sonner";

export default function Atendimento() {
  const navigate = useNavigate();
  const [concluirModalOpen, setConcluirModalOpen] = useState(false);
  const [entregarModalOpen, setEntregarModalOpen] = useState(false);
  const [veiculos, setVeiculos] = useState<VehicleData[]>(localDatabase);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');

  const veiculosEmAndamento = veiculos.filter(v => v.status === 'em_andamento');
  const veiculosFinalizados = veiculos.filter(v => v.status === 'finalizado');

  const concluirVeiculo = (placa: string) => {
    const sucesso = atualizarStatusVeiculo(placa, 'finalizado');
    if (sucesso) {
      setVeiculos([...localDatabase]);
      toast.success(`Veículo ${placa} finalizado com sucesso!`);
    } else {
      toast.error("Erro ao finalizar veículo");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleOpenPayment = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    setPaymentStatus('pending');
  };

  const simulatePayment = () => {
    setPaymentStatus('processing');
    
    setTimeout(() => {
      setPaymentStatus('success');
      toast.success("Pagamento confirmado!");
    }, 2000);
  };

  const handleDeliverVehicle = () => {
    if (selectedVehicle) {
      atualizarStatusVeiculo(selectedVehicle.placa, 'entregue');
      toast.success(`Veículo ${selectedVehicle.placa} foi marcado como entregue.`);
      setEntregarModalOpen(false);
      setSelectedVehicle(null);
      setPaymentStatus('pending');
      setVeiculos([...localDatabase]);
    }
  };

  const getStatusColor = (status: VehicleData['status']) => {
    switch (status) {
      case 'em_andamento':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-300';
      case 'finalizado':
        return 'bg-green-500/20 text-green-700 border-green-300';
      case 'entregue':
        return 'bg-blue-500/20 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-300';
    }
  };

  const getStatusText = (status: VehicleData['status']) => {
    switch (status) {
      case 'em_andamento':
        return 'Em Andamento';
      case 'finalizado':
        return 'Finalizado';
      case 'entregue':
        return 'Entregue';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wash-blue-light to-background">
      {/* Header */}
      <div className="text-center pt-8 pb-6 px-4">
        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-soft mb-4">
          <Droplets className="h-8 w-8 text-wash-blue" />
          <h1 className="text-2xl font-bold text-wash-blue">CarWash Pro</h1>
          <Sparkles className="h-6 w-6 text-wash-green" />
        </div>
        <p className="text-muted-foreground text-lg">Sistema de Gestão de Lava-Jato</p>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-6">
        {/* Main Action Card */}
        <Card className="shadow-wash border-none bg-gradient-to-br from-white to-wash-blue-light/30">
          <CardHeader className="text-center">
            <CardTitle className="text-wash-blue flex items-center justify-center gap-2">
              <Camera className="h-6 w-6" />
              Novo Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground mb-6">
              Capture a placa do veículo para iniciar o atendimento
            </div>
            <Button
              onClick={() => navigate("/camera")}
              variant="camera"
              size="lg"
              className="w-full text-lg py-6"
            >
              <Camera className="h-6 w-6" />
              📷 Tirar Foto da Placa
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="text-center shadow-soft cursor-pointer hover:shadow-wash transition-shadow"
            onClick={() => navigate("/dashboard")}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-wash-blue">12</div>
              <div className="text-sm text-muted-foreground">Carros Hoje</div>
            </CardContent>
          </Card>
          <Card 
            className="text-center shadow-soft cursor-pointer hover:shadow-wash transition-shadow"
            onClick={() => navigate("/dashboard")}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-wash-green">3</div>
              <div className="text-sm text-muted-foreground">Em Lavagem</div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Actions Card */}
        <Card className="shadow-soft bg-gradient-to-r from-wash-green/10 to-wash-blue/10 border-wash-green/30">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-wash-blue flex items-center justify-center gap-2">
              <Car className="h-5 w-5" />
              Controle de Veículos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setConcluirModalOpen(true)}
              variant="confirm"
              className="w-full flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Concluir Veículo
            </Button>
            <Button
              onClick={() => setEntregarModalOpen(true)}
              variant="wash"
              className="w-full flex items-center gap-2"
            >
              <Truck className="h-4 w-4" />
              Entregar Veículo
            </Button>
          </CardContent>
        </Card>


        {/* Features Overview */}
        <Card className="shadow-soft bg-wash-green-light/20 border-wash-green/30">
          <CardContent className="p-4">
            <h3 className="font-semibold text-wash-green mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Recursos do Sistema
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-wash-green rounded-full"></div>
                Captura automática de placas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-wash-green rounded-full"></div>
                Registro rápido de veículos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-wash-green rounded-full"></div>
                Controle de atendimentos
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Modal Concluir Veículo */}
      <Dialog open={concluirModalOpen} onOpenChange={setConcluirModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Concluir Veículos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {veiculosEmAndamento.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Car className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Nenhum veículo em andamento
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Todos os veículos foram finalizados ou não há atendimentos em processo.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {veiculosEmAndamento.map((veiculo) => (
                  <Card key={veiculo.placa} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">
                          {veiculo.placa}
                        </CardTitle>
                        <Badge className={getStatusColor(veiculo.status)}>
                          <Clock className="h-3 w-3 mr-1" />
                          {getStatusText(veiculo.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {veiculo.marca} {veiculo.modelo} - {veiculo.ano}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cor:</span>
                          <span className="font-medium">{veiculo.cor}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cliente:</span>
                          <span className="font-medium">{veiculo.cliente.nome}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Telefone:</span>
                          <span className="font-medium">{veiculo.cliente.telefone}</span>
                        </div>
                        {veiculo.hora_chegada && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Chegada:</span>
                            <span className="font-medium">{veiculo.hora_chegada}</span>
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={() => concluirVeiculo(veiculo.placa)}
                        className="w-full"
                        variant="default"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalizar Veículo
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Entregar Veículo */}
      <Dialog open={entregarModalOpen} onOpenChange={setEntregarModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Entregar Veículo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {veiculosFinalizados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Car className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Nenhum veículo pronto para entrega
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Os veículos aparecerão aqui após serem finalizados.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {veiculosFinalizados.map((vehicle) => (
                  <Card key={vehicle.placa} className="border-green-200 bg-green-50/30">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Car className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {vehicle.marca} {vehicle.modelo}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Placa: {vehicle.placa}</span>
                              <span>•</span>
                              <span>{vehicle.ano} - {vehicle.cor}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          Finalizado
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Client info */}
                      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{vehicle.cliente.nome}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {vehicle.cliente.telefone}
                            </span>
                            {vehicle.cliente.email && (
                              <span>{vehicle.cliente.email}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Service details and pricing */}
                      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span className="font-medium">Valor Total:</span>
                        </div>
                        <span className="text-xl font-bold text-primary">
                          {formatPrice(vehicle.valorTotal || 25.00)}
                        </span>
                      </div>

                      {/* Action button */}
                      <Button 
                        onClick={() => handleOpenPayment(vehicle)}
                        className="w-full"
                        size="lg"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Processar Pagamento e Entrega
                      </Button>

                      {/* Payment section */}
                      {selectedVehicle?.placa === vehicle.placa && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          <Separator />
                          
                          {paymentStatus === 'pending' && (
                            <div className="space-y-4">
                              <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30">
                                <QrCode className="h-16 w-16 text-muted-foreground/60 mb-4" />
                                <p className="text-sm text-muted-foreground text-center">
                                  QR Code para pagamento<br />
                                  <span className="font-mono text-xs">payment-{vehicle.placa}-{Date.now()}</span>
                                </p>
                              </div>
                              <div className="text-center">
                                <Button onClick={simulatePayment} size="lg" className="w-full">
                                  Simular Pagamento
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Clique para simular o pagamento via QR Code
                                </p>
                              </div>
                            </div>
                          )}

                          {paymentStatus === 'processing' && (
                            <div className="flex flex-col items-center justify-center p-8">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                              <p className="text-lg font-medium">Processando pagamento...</p>
                              <p className="text-sm text-muted-foreground">Aguarde a confirmação</p>
                            </div>
                          )}

                          {paymentStatus === 'success' && (
                            <div className="space-y-4">
                              <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-lg border-2 border-green-200">
                                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                  <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <p className="text-lg font-semibold text-green-800 mb-2">Pagamento Confirmado!</p>
                                <p className="text-sm text-green-600 text-center">
                                  O pagamento foi processado com sucesso.<br />
                                  Veículo pronto para entrega.
                                </p>
                              </div>
                              <div className="text-center space-y-2">
                                <Button onClick={handleDeliverVehicle} size="lg" className="w-full">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirmar Entrega do Veículo
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                  Clique para finalizar a entrega
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
