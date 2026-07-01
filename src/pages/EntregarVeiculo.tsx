import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, QrCode, Car, User, Phone, DollarSign, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { atualizarStatusVeiculo } from "@/data/mockData"
import { listVehiclesToDeliverApi, entregarVeiculoApi, DeliveryClient, DeliveryVehicle } from "@/services/clientApi"
import { toast } from "@/hooks/use-toast"

// Mock QR Code component
const QRCodeMock = ({ value }: { value: string }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30">
    <QrCode className="h-24 w-24 text-muted-foreground/60 mb-4" />
    <p className="text-sm text-muted-foreground text-center">
      QR Code para pagamento<br />
      <span className="font-mono text-xs">{value}</span>
    </p>
  </div>
)

// Payment success component
const PaymentSuccess = () => (
  <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-lg border-2 border-green-200">
    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
      <CheckCircle className="h-8 w-8 text-green-600" />
    </div>
    <p className="text-lg font-semibold text-green-800 mb-2">Pagamento Confirmado!</p>
    <p className="text-sm text-green-600 text-center">
      O pagamento foi processado com sucesso.<br />
      Veículos prontos para entrega.
    </p>
  </div>
)

export default function EntregarVeiculo() {
  const [clientes, setClientes] = useState<DeliveryClient[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<DeliveryClient | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending')
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isDelivering, setIsDelivering] = useState<boolean>(false)
  const [expandedClients, setExpandedClients] = useState<Set<number>>(new Set())

  const fetchClientes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await listVehiclesToDeliverApi()
      setClientes(data)
      // Expandir todos por padrão
      setExpandedClients(new Set(data.map(c => c.idcliente)))
    } catch (err: any) {
      console.error("Erro ao buscar clientes prontos para entrega:", err)
      setError(err.message || "Erro ao carregar veículos prontos para entrega.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  // Função utilitária para extrair de forma robusta os dados do veículo do payload (suporta formato achatado ou aninhado)
  const getVeiculoInfo = (v: any) => {
    if (!v) return { placa: "—", marca: "", modelo: "Veículo", cor: "" };
    
    // Se vier aninhado dentro de um objeto "veiculo"
    const target = v.veiculo && typeof v.veiculo === 'object' ? v.veiculo : v;
    
    return {
      placa: target.placa || v.placa || "—",
      marca: target.marca || v.marca || "",
      modelo: target.modelo || v.modelo || "Veículo",
      cor: target.cor || v.cor || ""
    };
  }

  const formatPhone = (phone: string) => {
    if (!phone) return "Não informado"
    // Remove o DDI 55 se presente
    let cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('55') && cleaned.length > 11) {
      cleaned = cleaned.substring(2)
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const toggleExpanded = (idcliente: number) => {
    setExpandedClients(prev => {
      const next = new Set(prev)
      if (next.has(idcliente)) {
        next.delete(idcliente)
      } else {
        next.add(idcliente)
      }
      return next
    })
  }

  const totalVeiculos = clientes.reduce((acc, c) => acc + c.veiculos.length, 0)

  const handleOpenPayment = (client: DeliveryClient) => {
    setSelectedClient(client)
    setPaymentStatus('pending')
    setIsPaymentDialogOpen(true)
  }

  const simulatePayment = () => {
    setPaymentStatus('processing')
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('success')
      toast({
        title: "Pagamento Confirmado",
        description: "O pagamento foi processado com sucesso!",
      })
    }, 2000)
  }

  const handleDeliverClient = async () => {
    if (!selectedClient) return

    try {
      setIsDelivering(true)

      // Mapear todos os idlavagem dos veículos do cliente que estão sendo entregues
      const idsLavagem = selectedClient.veiculos
        .map(v => v.idlavagem)
        .filter((id): id is number => typeof id === 'number' && id > 0);

      if (idsLavagem.length > 0) {
        // Envia todos os IDs de lavagem em uma única chamada de array à API
        await entregarVeiculoApi(idsLavagem);
      }

      // Sincronizar banco mockado local para todos os veículos entregues
      selectedClient.veiculos.forEach(veiculo => {
        atualizarStatusVeiculo(veiculo.placa, 'entregue');
      });

      // Remover o cliente da listagem
      setClientes(prev => prev.filter(c => c.idcliente !== selectedClient.idcliente))

      toast({
        title: "Veículos Entregues",
        description: `Todos os veículos de ${selectedClient.cliente.nome} foram entregues com sucesso.`,
      })
      setIsPaymentDialogOpen(false)
      setSelectedClient(null)
      setPaymentStatus('pending')
    } catch (err: any) {
      console.error("Erro ao entregar veículos:", err)
      toast({
        title: "Erro ao Entregar",
        description: err.message || "Não foi possível confirmar a entrega dos veículos.",
        variant: "destructive"
      })
    } finally {
      setIsDelivering(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entregar Veículo</h1>
          <p className="text-muted-foreground">Finalize o pagamento e entregue os veículos</p>
        </div>
        
        {!isLoading && !error && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'} • {totalVeiculos} {totalVeiculos === 1 ? 'veículo' : 'veículos'}
            </Badge>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-wash-blue" />
          <p className="text-muted-foreground text-sm">Carregando veículos prontos para entrega...</p>
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Erro de Conexão</h3>
            <p className="text-sm text-red-600 max-w-md mb-6">{error}</p>
            <Button onClick={fetchClientes} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : clientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Car className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Nenhum veículo pronto para entrega
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Os veículos aparecerão aqui após serem finalizados na página "Concluir Veículo"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {clientes.map((clienteData) => {
            const isExpanded = expandedClients.has(clienteData.idcliente)

            return (
              <Card key={clienteData.idcliente} className="border-green-200/60 bg-gradient-to-br from-white to-green-50/30 hover:shadow-lg transition-all duration-300">
                {/* Cabeçalho do Cliente */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-green-100 rounded-xl">
                        <User className="h-5 w-5 text-green-700" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground">
                          {clienteData.cliente.nome}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span className="font-mono text-xs">
                            {formatPhone(clienteData.cliente.telefone)}
                          </span>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total a Pagar</p>
                        <p className="text-xl font-bold text-green-700">
                          {formatPrice(clienteData.totalapagar)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpanded(clienteData.idcliente)}
                        className="h-8 w-8"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Badge de veículos e info sempre visível */}
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100/80 text-green-800 border-green-200 text-xs">
                        <Car className="h-3 w-3 mr-1" />
                        {clienteData.veiculos.length} {clienteData.veiculos.length === 1 ? 'veículo' : 'veículos'}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                        Pronto para Entrega
                      </Badge>
                    </div>
                    
                    {/* Lista rápida de veículos e placas associadas */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {clienteData.veiculos.map(veiculo => {
                        const info = getVeiculoInfo(veiculo);
                        return (
                          <div 
                            key={veiculo.idveiculo} 
                            className="flex items-center gap-1.5 text-xs bg-muted/60 px-2 py-1 rounded border border-border/40 font-medium"
                          >
                            <span className="font-mono bg-white text-blue-700 px-1 rounded border border-blue-100 font-semibold text-[10px]">
                              {info.placa}
                            </span>
                            <span className="text-foreground/80">
                              {info.marca} {info.modelo}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    {/* Lista de Veículos */}
                    <div className="space-y-3">
                      {clienteData.veiculos.map((veiculo) => {
                        const info = getVeiculoInfo(veiculo);
                        return (
                          <div
                            key={veiculo.idveiculo}
                            className="border border-border/60 rounded-lg p-4 bg-white/80 space-y-3"
                          >
                            {/* Info do veículo */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-50 rounded-md">
                                  <Car className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-foreground">
                                    {info.marca} {info.modelo}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                                      {info.placa}
                                    </span>
                                    {info.cor && (
                                      <>
                                        <span>•</span>
                                        <span>Cor: {info.cor}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Subtotal</p>
                              <p className="text-base font-bold text-foreground">
                                {formatPrice(veiculo.valor)}
                              </p>
                            </div>
                          </div>

                          {/* Serviços do veículo */}
                          {veiculo.servicos && veiculo.servicos.length > 0 && (
                            <div className="border-t pt-2">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                Serviços Realizados
                              </span>
                              <div className="space-y-1">
                                {veiculo.servicos.map((servico, idx) => (
                                  <div
                                    key={servico.idservico || idx}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-[10px] font-normal px-2 py-0.5">
                                        {servico.nome}
                                        {servico.quantidade && servico.quantidade > 1 ? ` (${servico.quantidade}x)` : ""}
                                      </Badge>
                                    </div>
                                    <span className="font-medium text-xs text-muted-foreground">
                                      {formatPrice(servico.valor)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>

                    <Separator />

                    {/* Rodapé com total e botão de pagamento */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-700" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total do Cliente</p>
                          <p className="text-xl font-bold text-green-700">
                            {formatPrice(clienteData.totalapagar)}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOpenPayment(clienteData)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Processar Pagamento
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pagamento e Entrega</DialogTitle>
            <DialogDescription>
              {selectedClient && `Cliente: ${selectedClient.cliente.nome}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumo dos veículos no diálogo */}
            {selectedClient && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {selectedClient.veiculos.map((veiculo) => {
                  const info = getVeiculoInfo(veiculo);
                  return (
                    <div key={veiculo.idveiculo} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                      <div className="flex items-center gap-2">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono text-xs font-semibold">{info.placa}</span>
                        <span className="text-muted-foreground text-xs">
                          {info.marca} {info.modelo}
                        </span>
                      </div>
                      <span className="font-semibold text-xs">{formatPrice(veiculo.valor)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <Separator />

            {/* Valor total a pagar */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total a Pagar:</p>
              <p className="text-3xl font-bold text-green-700">
                {selectedClient && formatPrice(selectedClient.totalapagar)}
              </p>
            </div>

            <Separator />

            {/* Payment section */}
            {paymentStatus === 'pending' && (
              <div className="space-y-4">
                <QRCodeMock value={`payment-${selectedClient?.idcliente}-${Date.now()}`} />
                <div className="text-center">
                  <Button onClick={simulatePayment} size="lg" className="w-full bg-green-600 hover:bg-green-700">
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                <p className="text-lg font-medium">Processando pagamento...</p>
                <p className="text-sm text-muted-foreground">Aguarde a confirmação</p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="space-y-4">
                <PaymentSuccess />
                <div className="text-center space-y-2">
                  <Button
                    onClick={handleDeliverClient}
                    disabled={isDelivering}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isDelivering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Entregando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar Entrega dos Veículos
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Clique para finalizar a entrega de todos os veículos do cliente
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}