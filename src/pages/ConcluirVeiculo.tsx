import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listVehiclesInServiceApi, concluirVeiculoApi, APIVehicleInService } from "@/services/clientApi";
import { atualizarStatusVeiculo } from "@/data/mockData";
import { CheckCircle, Clock, Car, Loader2, User, Phone, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ConcluirVeiculo() {
  const [veiculos, setVeiculos] = useState<APIVehicleInService[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [concluindoId, setConcluindoId] = useState<number | null>(null);

  const fetchVeiculos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listVehiclesInServiceApi();
      
      // Filtrar apenas veículos que estão em atendimento (não finalizados ou entregues)
      const emAndamento = data.filter(
        (v) => v.status !== "completed" && v.status !== "delivered" && v.status !== "finalizado" && v.status !== "entregue"
      );
      setVeiculos(emAndamento);
    } catch (err: any) {
      console.error("Erro ao buscar veículos em atendimento:", err);
      setError(err.message || "Erro ao carregar veículos em atendimento.");
      toast.error("Não foi possível carregar a lista de veículos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const concluirVeiculo = async (idlavagem: number, placa: string) => {
    try {
      setConcluindoId(idlavagem);
      
      // Executa o endpoint veiculo_concluir na API real
      await concluirVeiculoApi(idlavagem);

      // Sincroniza o banco de dados simulado local também
      atualizarStatusVeiculo(placa, "finalizado");
      
      setVeiculos((prev) => prev.filter((v) => v.idlavagem !== idlavagem));
      toast.success(`Veículo ${placa} finalizado com sucesso!`);
    } catch (err: any) {
      console.error("Erro ao finalizar veículo:", err);
      toast.error(err.message || "Erro ao finalizar veículo");
    } finally {
      setConcluindoId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "aguardando":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-300";
      case "in_progress":
      case "aberta":
      case "em_andamento":
      case "em andamento":
        return "bg-blue-500/20 text-blue-700 border-blue-300";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "aguardando":
        return "Aguardando";
      case "in_progress":
      case "aberta":
      case "em_andamento":
      case "em andamento":
        return "Em Andamento";
      default:
        return status || "Desconhecido";
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "-";
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 px-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-8 w-8 text-wash-blue" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Concluir Veículos</h1>
          <p className="text-muted-foreground">Finalize os veículos que estão em andamento</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-wash-blue" />
          <p className="text-muted-foreground text-sm">Carregando veículos em atendimento...</p>
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
            <Car className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Nenhum veículo em andamento
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Todos os veículos foram finalizados ou não há atendimentos em processo no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {veiculos.map((item) => {
            const placa = item.veiculo?.placa || "N/A";
            const marca = item.veiculo?.marca || "";
            const modelo = item.veiculo?.modelo || "Modelo Desconhecido";
            const cor = item.veiculo?.cor || "Não informada";
            const clienteNome = item.cliente?.nome || "Não informado";
            const clienteTelefone = item.cliente?.telefone || "Não informado";

            return (
              <Card key={item.idlavagem} className="hover:shadow-lg transition-all duration-300 border border-border/60">
                <CardHeader className="pb-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-mono font-bold bg-wash-blue text-white px-3 py-1 rounded shadow-sm">
                      {placa}
                    </CardTitle>
                    <Badge className={getStatusColor(item.status)} variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {getStatusText(item.status)}
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold text-foreground mt-2">
                    {marca} {modelo}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cor: {cor}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium ml-auto truncate max-w-[180px]" title={clienteNome}>
                        {clienteNome}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="font-medium ml-auto font-mono">{clienteTelefone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Chegada:</span>
                      <span className="font-medium ml-auto">{formatTime(item.entrada)}</span>
                    </div>

                    {item.minutos > 0 && (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Tempo Decorrido:</span>
                        <span className="font-medium ml-auto text-amber-600">{item.minutos} min</span>
                      </div>
                    )}
                  </div>

                  {item.servicos && item.servicos.length > 0 && (
                    <div className="border-t pt-3 space-y-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Serviços Vinculados
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                        {item.servicos.map((s) => (
                          <Badge key={s.idservico} variant="secondary" className="text-[11px] font-normal px-2 py-0.5">
                            {s.nome} {s.quantidade > 1 ? `(${s.quantidade}x)` : ""}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-wash-green" />
                      <span className="text-sm text-muted-foreground">Total:</span>
                    </div>
                    <span className="text-lg font-bold text-wash-green">
                      R$ {item.total?.toFixed(2) || "0,00"}
                    </span>
                  </div>

                  <Button 
                    onClick={() => concluirVeiculo(item.idlavagem, placa)}
                    disabled={concluindoId !== null}
                    className="w-full mt-2 bg-wash-blue hover:bg-wash-blue/90 text-white font-medium shadow-sm transition-colors"
                  >
                    {concluindoId === item.idlavagem ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalizar Veículo
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}