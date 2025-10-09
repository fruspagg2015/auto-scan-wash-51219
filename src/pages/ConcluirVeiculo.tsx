import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { localDatabase, atualizarStatusVeiculo, VehicleData } from "@/data/mockData";
import { CheckCircle, Clock, Car } from "lucide-react";
import { toast } from "sonner";

export default function ConcluirVeiculo() {
  const [veiculos, setVeiculos] = useState<VehicleData[]>(localDatabase);

  const veiculosEmAndamento = veiculos.filter(v => v.status === 'em_andamento');

  const concluirVeiculo = (placa: string) => {
    const sucesso = atualizarStatusVeiculo(placa, 'finalizado');
    if (sucesso) {
      setVeiculos([...localDatabase]);
      toast.success(`Veículo ${placa} finalizado com sucesso!`);
    } else {
      toast.error("Erro ao finalizar veículo");
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Concluir Veículos</h1>
          <p className="text-muted-foreground">Finalize os veículos que estão em andamento</p>
        </div>
      </div>

      {veiculosEmAndamento.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Nenhum veículo em andamento
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Todos os veículos foram finalizados ou não há atendimentos em processo.
            </p>
          </CardContent>
        </Card>
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
  );
}