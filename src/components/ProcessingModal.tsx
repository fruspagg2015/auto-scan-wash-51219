import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Camera, Database, Globe, UserPlus, CheckCircle, Edit, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import Tesseract from "tesseract.js";

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface ProcessingModalProps {
  isOpen: boolean;
  onComplete: (result: any) => void;
  onCancel: () => void;
  capturedImage: string;
  onRequestClientData: (vehicleData: any) => void;
}

// Função auxiliar para extrair a placa do texto gerado pelo OCR
const extractPlate = (text: string): string => {
  // Limpar texto mantendo apenas letras e números
  const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Tentar encontrar padrão Mercosul: 3 letras, 1 número, 1 letra, 2 números
  const mercosulMatch = clean.match(/[A-Z]{3}[0-9][A-Z][0-9]{2}/);
  if (mercosulMatch) return mercosulMatch[0];
  
  // Tentar encontrar padrão antigo: 3 letras, 4 números
  const oldMatch = clean.match(/[A-Z]{3}[0-9]{4}/);
  if (oldMatch) return oldMatch[0];

  // Se não encontrar o padrão exato, retornar os primeiros 7 caracteres alfanuméricos que comecem com letras
  const generalMatch = clean.match(/[A-Z]{3}[A-Z0-9]{4}/);
  if (generalMatch) return generalMatch[0];

  // Fallback: qualquer sequência de 7 letras/números ou string vazia
  const fallbackMatch = clean.match(/[A-Z0-9]{7}/);
  if (fallbackMatch) return fallbackMatch[0];

  return "";
};

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  onComplete,
  onCancel,
  capturedImage,
  onRequestClientData
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedPlate, setConfirmedPlate] = useState("");
  const [isQueryingDb, setIsQueryingDb] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'ocr',
      title: 'Lendo imagem da placa',
      description: 'Executando OCR local na imagem...',
      icon: <Camera className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'database',
      title: 'Buscando cadastro do veículo',
      description: 'Aguardando confirmação da placa...',
      icon: <Database className="h-5 w-5" />,
      status: 'pending'
    }
  ]);

  useEffect(() => {
    if (!isOpen) {
      setIsConfirming(false);
      setConfirmedPlate("");
      setIsQueryingDb(false);
      setSteps([
        {
          id: 'ocr',
          title: 'Lendo imagem da placa',
          description: 'Executando OCR local na imagem...',
          icon: <Camera className="h-5 w-5" />,
          status: 'pending'
        },
        {
          id: 'database',
          title: 'Buscando cadastro do veículo',
          description: 'Aguardando confirmação da placa...',
          icon: <Database className="h-5 w-5" />,
          status: 'pending'
        }
      ]);
      return;
    }

    const runOCR = async () => {
      try {
        setSteps(prev => prev.map(step =>
          step.id === 'ocr' ? { ...step, status: 'processing', description: 'Processando texto da imagem...' } : step
        ));

        // Executar OCR usando tesseract.js
        const result = await Tesseract.recognize(
          capturedImage,
          'eng',
          {
            logger: m => console.log("Tesseract progress:", m.status, m.progress)
          }
        );

        const ocrText = result.data.text;
        console.log("OCR Texto bruto detectado:", ocrText);
        
        const plate = extractPlate(ocrText);
        console.log("Placa extraída:", plate);

        setSteps(prev => prev.map(step =>
          step.id === 'ocr' ? { ...step, status: 'completed', description: `✓ OCR concluído!` } : step
        ));

        setConfirmedPlate(plate);
        setIsConfirming(true);
      } catch (error) {
        console.error("Erro ao executar OCR:", error);
        setSteps(prev => prev.map(step =>
          step.id === 'ocr' ? { ...step, status: 'error', description: 'Falha ao ler a placa. Digite manualmente.' } : step
        ));
        setConfirmedPlate("");
        setIsConfirming(true);
      }
    };

    runOCR();
  }, [isOpen, capturedImage]);

  const handleConfirmPlate = async () => {
    const formattedPlate = confirmedPlate.replace(/[^A-Z0-9]/g, '').toUpperCase();
    if (formattedPlate.length < 7) {
      return;
    }

    setIsConfirming(false);
    setIsQueryingDb(true);

    try {
      setSteps(prev => prev.map(step =>
        step.id === 'database' ? { ...step, status: 'processing', description: 'Consultando placa no banco de dados...' } : step
      ));

      const { data: veiculoCache, error: cacheError } = await supabase
        .from('veiculos')
        .select('*')
        .eq('placa', formattedPlate)
        .maybeSingle();

      let vehicleData;

      if (!cacheError && veiculoCache) {
        // Encontrado no cache/banco
        setSteps(prev => prev.map(step =>
          step.id === 'database' ? { ...step, status: 'completed', description: '✓ Veículo encontrado!' } : step
        ));

        vehicleData = {
          placa: veiculoCache.placa,
          marca: veiculoCache.marca || '',
          modelo: veiculoCache.modelo || '',
          submodelo: veiculoCache.submodelo || '',
          versao: veiculoCache.versao || '',
          ano: veiculoCache.ano || '',
          anoModelo: veiculoCache.anomodelo || '',
          cor: veiculoCache.cor || '',
          municipio: veiculoCache.municipio || '',
          uf: veiculoCache.uf || '',
          imagem: capturedImage,
          hora_chegada: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          fonte: 'cache',
          idplaca: veiculoCache.idplaca
        };
      } else {
        // Não encontrado - Criar registro inicial com idplaca
        const { data: novoVeiculo, error: insertError } = await supabase
          .from('veiculos')
          .insert({
            placa: formattedPlate
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao salvar novo veículo:', insertError);
        }

        setSteps(prev => prev.map(step =>
          step.id === 'database' ? { ...step, status: 'completed', description: '✓ Novo cadastro iniciado!' } : step
        ));

        vehicleData = {
          placa: formattedPlate,
          marca: '',
          modelo: '',
          submodelo: '',
          versao: '',
          ano: '',
          anoModelo: '',
          cor: '',
          municipio: '',
          uf: '',
          imagem: capturedImage,
          hora_chegada: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          fonte: 'manual',
          idplaca: novoVeiculo?.idplaca
        };
      }

      // Prosseguir para coleta de dados do cliente
      onRequestClientData(vehicleData);
    } catch (error) {
      console.error("Erro ao salvar/buscar veículo:", error);
      onRequestClientData({
        placa: formattedPlate,
        imagem: capturedImage,
        hora_chegada: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        fonte: 'manual'
      });
    } finally {
      setIsQueryingDb(false);
    }
  };

  const getStepIcon = (step: ProcessingStep) => {
    if (step.status === 'processing') {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    if (step.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-wash-green" />;
    }
    return step.icon;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="max-w-md mx-auto [&>button]:hidden bg-background">
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-wash-blue mb-2">
              {isConfirming ? "📝 Confirme a Placa" : "🔍 Processando Dados"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isConfirming 
                ? "Verifique se a placa lida está correta. Ajuste se necessário." 
                : "Analisando a imagem localmente..."}
            </p>
          </div>

          {!isConfirming ? (
            <div className="space-y-4">
              {steps.map((step) => (
                <Card
                  key={step.id}
                  className={`transition-all duration-300 ${
                    step.status === 'processing' ? 'ring-2 ring-wash-blue/30 shadow-wash' :
                    step.status === 'completed' ? 'bg-wash-green-light/20 border-wash-green/30' :
                    step.status === 'error' ? 'bg-destructive/10 border-destructive/30' :
                    'opacity-60'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 ${
                        step.status === 'processing' ? 'text-wash-blue' :
                        step.status === 'completed' ? 'text-wash-green' :
                        step.status === 'error' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        {getStepIcon(step)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{step.title}</h3>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Estilo da Placa do Mercosul */}
              <div className="border-[3px] border-black rounded-lg overflow-hidden bg-white shadow-lg max-w-[280px] mx-auto">
                {/* Faixa azul superior */}
                <div className="bg-[#003399] text-white text-[10px] font-bold py-1 px-3 flex justify-between items-center tracking-widest uppercase">
                  <span>BRASIL</span>
                  <div className="w-4 h-2.5 bg-yellow-400 rounded-sm flex items-center justify-center text-[6px] text-blue-900 font-bold">
                    🇧🇷
                  </div>
                </div>
                {/* Campo da Placa */}
                <div className="p-2 bg-white flex items-center justify-center">
                  <Input
                    type="text"
                    value={confirmedPlate}
                    onChange={(e) => setConfirmedPlate(e.target.value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 7).toUpperCase())}
                    className="border-none shadow-none text-center font-mono text-3xl font-black uppercase tracking-widest text-black bg-transparent w-full h-14 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="ABC1D23"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmPlate}
                  className="flex-1 bg-wash-blue hover:bg-wash-blue/90 text-white"
                  disabled={confirmedPlate.length < 7}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Placa
                </Button>
              </div>
            </div>
          )}

          {!isConfirming && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={steps.some(s => s.status === 'processing') || isQueryingDb}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};