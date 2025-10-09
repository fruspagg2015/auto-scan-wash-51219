import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, QrCode, Car, User, Phone, DollarSign, Clock } from "lucide-react"
import { localDatabase, atualizarStatusVeiculo, type VehicleData } from "@/data/mockData"
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
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending')
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  // Filter vehicles ready for delivery (status 'finalizado')
  const veiculosFinalizados = localDatabase.filter(vehicle => vehicle.status === 'finalizado')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const handleOpenPayment = (vehicle: VehicleData) => {
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

  const handleDeliverVehicle = () => {
    if (selectedVehicle) {
      atualizarStatusVeiculo(selectedVehicle.placa, 'entregue')
      toast({
        title: "Veículo Entregue",
        description: `Veículo ${selectedVehicle.placa} foi marcado como entregue.`,
      })
      setIsPaymentDialogOpen(false)
      setSelectedVehicle(null)
      setPaymentStatus('pending')
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
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            {veiculosFinalizados.length} veículos prontos
          </Badge>
        </div>
      </div>

      {/* Empty state */}
      {veiculosFinalizados.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Nenhum veículo pronto para entrega
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Os veículos aparecerão aqui após serem finalizados na página "Concluir Veículo"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Vehicles ready for delivery */}
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
                    <CardDescription className="flex items-center gap-4">
                      <span>Placa: {vehicle.placa}</span>
                      <span>•</span>
                      <span>{vehicle.ano} - {vehicle.cor}</span>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento e Entrega</DialogTitle>
            <DialogDescription>
              {selectedVehicle && `${selectedVehicle.marca} ${selectedVehicle.modelo} - ${selectedVehicle.placa}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment amount */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor a pagar:</p>
              <p className="text-3xl font-bold text-primary">
                {selectedVehicle && formatPrice(selectedVehicle.valorTotal || 25.00)}
              </p>
            </div>

            <Separator />

            {/* Payment section */}
            {paymentStatus === 'pending' && (
              <div className="space-y-4">
                <QRCodeMock value={`payment-${selectedVehicle?.placa}-${Date.now()}`} />
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
        </DialogContent>
      </Dialog>
    </div>
  )
}