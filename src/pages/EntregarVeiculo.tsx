import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, QrCode, Car, User, Phone, DollarSign, Clock, Loader2, AlertCircle } from "lucide-react"
import { atualizarStatusVeiculo } from "@/data/mockData"
import { listVehiclesToDeliverApi, entregarVeiculoApi, APIVehicleInService } from "@/services/clientApi"
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
      Veículo pronto para entrega.
    </p>
  </div>
)

export default function EntregarVeiculo() {
  const [veiculos, setVeiculos] = useState<APIVehicleInService[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<APIVehicleInService | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending')
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isDelivering, setIsDelivering] = useState<boolean>(false)

  const fetchVeiculos = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await listVehiclesToDeliverApi()
      setVeiculos(data)
    } catch (err: any) {
      console.error("Erro ao buscar veículos prontos para entrega:", err)
      setError(err.message || "Erro ao carregar veículos prontos para entrega.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVeiculos()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const handleOpenPayment = (vehicle: APIVehicleInService) => {
    setSelectedVehicle(vehicle)
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

  const handleDeliverVehicle = async () => {
    if (selectedVehicle) {
      const placa = selectedVehicle.veiculo?.placa || "N/A"
      try {
        setIsDelivering(true)
        
        // Chamada real ao endpoint veiculo_entregar
        await entregarVeiculoApi(selectedVehicle.idlavagem)

        // Sincronizar banco mockado local
        atualizarStatusVeiculo(placa, 'entregue')
        
        // Remover da listagem da tela
        setVeiculos(prev => prev.filter(v => v.idlavagem !== selectedVehicle.idlavagem))
        
        toast({
          title: "Veículo Entregue",
          description: `Veículo ${placa} foi marcado como entregue com sucesso.`,
        })
        setIsPaymentDialogOpen(false)
        setSelectedVehicle(null)
        setPaymentStatus('pending')
      } catch (err: any) {
        console.error("Erro ao entregar veículo:", err)
        toast({
          title: "Erro ao Entregar",
          description: err.message || "Não foi possível confirmar a entrega do veículo.",
          variant: "destructive"
        })
      } finally {
        setIsDelivering(false)
      }
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
              {veiculos.length} veículos prontos
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
            <Button onClick={fetchVeiculos} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : veiculos.length === 0 ? (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {veiculos.map((item) => {
            const placa = item.veiculo?.placa || "N/A"
            const marca = item.veiculo?.marca || ""
            const modelo = item.veiculo?.modelo || "Modelo Desconhecido"
            const cor = item.veiculo?.cor || "Não informada"
            const clienteNome = item.cliente?.nome || "Não informado"
            const clienteTelefone = item.cliente?.telefone || "Não informado"

            return (
              <Card key={item.idlavagem} className="border-green-200 bg-green-50/10 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Car className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">
                          {marca} {modelo}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 text-xs font-semibold">
                          <span className="font-mono bg-green-200/50 text-green-800 px-1.5 py-0.5 rounded">Placa: {placa}</span>
                          <span>•</span>
                          <span>Cor: {cor}</span>
                        </CardDescription>
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
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{clienteNome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <Phone className="h-3 w-3" />
                        {clienteTelefone}
                      </div>
                    </div>
                  </div>

                  {/* Services List */}
                  {item.servicos && item.servicos.length > 0 && (
                    <div className="border-t pt-3 space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Serviços Realizados
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.servicos.map((s) => (
                          <Badge key={s.idservico} variant="secondary" className="text-[10px] font-normal px-2 py-0.5">
                            {s.nome} {s.quantidade > 1 ? `(${s.quantidade}x)` : ""}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service details and pricing */}
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm text-foreground">Valor Total:</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(item.total || 0)}
                    </span>
                  </div>

                  {/* Action button */}
                  <Button 
                    onClick={() => handleOpenPayment(item)}
                    className="w-full mt-2"
                    size="lg"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Processar Pagamento e Entrega
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento e Entrega</DialogTitle>
            <DialogDescription>
              {selectedVehicle && `${selectedVehicle.veiculo?.marca || ""} ${selectedVehicle.veiculo?.modelo || ""} - ${selectedVehicle.veiculo?.placa || "N/A"}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment amount */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor a pagar:</p>
              <p className="text-3xl font-bold text-primary">
                {selectedVehicle && formatPrice(selectedVehicle.total || 0)}
              </p>
            </div>

            <Separator />

            {/* Payment section */}
            {paymentStatus === 'pending' && (
              <div className="space-y-4">
                <QRCodeMock value={`payment-${selectedVehicle?.veiculo?.placa || "N/A"}-${Date.now()}`} />
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
                <PaymentSuccess />
                <div className="text-center space-y-2">
                  <Button 
                    onClick={handleDeliverVehicle} 
                    disabled={isDelivering}
                    size="lg" 
                    className="w-full"
                  >
                    {isDelivering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Entregando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar Entrega do Veículo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Clique para finalizar a entrega
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