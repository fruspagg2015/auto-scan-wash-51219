import React, { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Check, Loader2, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ClientDataModal } from "@/components/ClientDataModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { consultarPlacaApi } from "@/services/clientApi";

const CameraCapture = () => {
  const [manualPlate, setManualPlate] = useState("");
  const [isSearchingPlate, setIsSearchingPlate] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [vehicleDataForClient, setVehicleDataForClient] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    // Verifica se é colagem de vários caracteres ou autocompletar
    if (value.length > 1) {
      handlePasteData(value);
      return;
    }

    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    
    if (!upperValue && value !== "") return;

    let newPlate = manualPlate.split("");
    for (let i = 0; i < 7; i++) {
      if (!newPlate[i]) newPlate[i] = "";
    }
    
    newPlate[index] = upperValue;
    const updatedPlate = newPlate.join("").substring(0, 7);
    setManualPlate(updatedPlate);

    if (upperValue !== "") {
      if (index < 6) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 10);
      } else if (index === 6) {
        setTimeout(() => document.getElementById("validar-btn")?.focus(), 10);
      }
    }
  };

  const handlePasteData = (pastedData: string) => {
    const cleaned = pastedData.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 7);
    setManualPlate(cleaned);
    if (cleaned.length === 7) {
      setTimeout(() => document.getElementById("validar-btn")?.focus(), 10);
    } else {
      const nextIndex = Math.min(cleaned.length, 6);
      setTimeout(() => inputRefs.current[nextIndex]?.focus(), 10);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    handlePasteData(e.clipboardData.getData("text"));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!manualPlate[index] && index > 0) {
        let newPlate = manualPlate.split("");
        newPlate[index - 1] = "";
        setManualPlate(newPlate.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleFocus = (index: number) => {
    const firstEmptyIndex = manualPlate.length;
    if (index > firstEmptyIndex && firstEmptyIndex < 7) {
      inputRefs.current[firstEmptyIndex]?.focus();
    }
  };

  const handleManualSearch = useCallback(async () => {
    if (manualPlate.length < 7) {
      toast({
        title: "Placa incompleta",
        description: "A placa deve conter 7 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearchingPlate(true);
    try {
      const hora = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const response = await consultarPlacaApi(manualPlate);
      const placaData = response.payload;

      const vehicleData = {
        placa: placaData.placa || manualPlate,
        marca: placaData.marca || "",
        modelo: placaData.modelo || "", 
        submodelo: "",
        versao: "",
        ano: placaData.anofabricacao ? String(placaData.anofabricacao) : "",
        anoModelo: placaData.anomodelo ? String(placaData.anomodelo) : "",
        cor: "",
        municipio: "",
        uf: placaData.uf || "",
        imagem: null,
        hora_chegada: hora,
        cliente: placaData.cliente ? {
          id: placaData.cliente.id || placaData.cliente.idcliente || 0,
          nome: placaData.cliente.nome,
          telefone: placaData.cliente.telefone,
          cadastrado: true
        } : null,
        fonte: "api",
        idplaca: placaData.idveiculo,
        status: placaData.status,
      };

      setVehicleDataForClient(vehicleData);
      setShowClientModal(true);
    } catch (error: any) {
      console.error("Erro ao consultar placa via API:", error);
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível validar a placa.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingPlate(false);
    }
  }, [manualPlate]);

  const handleClientDataComplete = useCallback(
    (result: any) => {
      setShowClientModal(false);
      setVehicleDataForClient(null);
      navigate("/vehicle-details", { state: result });
    },
    [navigate]
  );

  const handleClientDataCancel = useCallback(() => {
    setShowClientModal(false);
    setVehicleDataForClient(null);
  }, []);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 7);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Buscar apenas se tiver pelo menos 2 caracteres e menos que 7
      if (manualPlate.length >= 2 && manualPlate.length < 7) {
        const { data } = await supabase
          .from("veiculos")
          .select("placa")
          .ilike("placa", `${manualPlate}%`)
          .limit(4);
          
        if (data && data.length > 0) {
          setSuggestions(data.map((d) => d.placa));
        } else {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [manualPlate]);

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-wash-blue-light to-background p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full h-10 w-10 bg-white shadow-sm hover:bg-gray-100 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-wash-blue" />
          </Button>
          <h1 className="text-2xl font-bold text-wash-blue tracking-tight">Nova Chegada</h1>
        </div>

        <Card className="p-6 sm:p-8 shadow-xl border-none rounded-3xl bg-white/90 backdrop-blur-sm">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 bg-wash-blue/10 rounded-full flex items-center justify-center text-wash-blue mb-2">
              <Car className="h-8 w-8" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Informe a Placa</h2>
              <p className="text-sm text-gray-500">
                Digite a placa do veículo para iniciar o atendimento.
              </p>
            </div>

            <div 
              className="flex gap-1.5 sm:gap-2 justify-center w-full my-6"
              onPaste={handlePaste}
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  maxLength={1}
                  value={manualPlate[i] || ""}
                  onChange={(e) => handleInputChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={() => handleFocus(i)}
                  className={`w-10 sm:w-12 h-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold font-mono uppercase rounded-xl border-2 transition-all outline-none
                    ${
                      manualPlate[i]
                        ? "border-wash-blue bg-wash-blue/5 text-wash-blue"
                        : "border-gray-200 bg-gray-50 text-gray-400 focus:border-wash-blue/50 focus:bg-white"
                    }
                  `}
                />
              ))}
            </div>

            {/* Sugestões de Autocompletar */}
            {suggestions.length > 0 && (
              <div className="w-full mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs text-gray-400 mb-2 font-medium">Placas sugeridas:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((placa) => (
                    <Button
                      key={placa}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setManualPlate(placa);
                        setSuggestions([]);
                      }}
                      className="font-mono border-wash-blue/20 text-wash-blue hover:bg-wash-blue hover:text-white transition-all h-8"
                    >
                      {placa}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              id="validar-btn"
              onClick={handleManualSearch}
              disabled={manualPlate.length < 7 || isSearchingPlate}
              className="w-full h-14 text-lg font-bold rounded-2xl bg-wash-blue hover:bg-wash-blue/90 text-white shadow-lg shadow-wash-blue/20 transition-all active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-wash-blue/50"
            >
              {isSearchingPlate ? (
                <>
                  <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="h-6 w-6 mr-2" />
                  Validar Placa
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      <ClientDataModal
        isOpen={showClientModal}
        onComplete={handleClientDataComplete}
        onCancel={handleClientDataCancel}
        vehicleData={vehicleDataForClient}
      />
    </div>
  );
};

export default CameraCapture;