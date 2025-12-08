import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Camera, Database, Globe, UserPlus, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  onComplete,
  onCancel,
  capturedImage,
  onRequestClientData
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'api',
      title: 'Analisando imagem',
      description: 'Processando foto e consultando dados...',
      icon: <Globe className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'client',
      title: 'Dados do cliente',
      description: 'Coletando informações do cliente...',
      icon: <UserPlus className="h-5 w-5" />,
      status: 'pending'
    }
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const processSteps = async () => {
      try {
        // Etapa 1: Verificar cache no banco de dados primeiro
        setSteps(prev => prev.map((step, index) => 
          index === 0 ? { ...step, status: 'processing', description: 'Verificando cache de placas...' } : step
        ));
        
        // Converter base64 para Blob para enviar à API
        const base64Data = capturedImage.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const imageBlob = new Blob([byteArray], { type: 'image/jpeg' });
        
        // Criar FormData e anexar o arquivo
        const formData = new FormData();
        formData.append('image', imageBlob, 'placa.jpg');
        
        // Primeiro, tentar obter a placa da API para ter o texto da placa
        setSteps(prev => prev.map((step, index) => 
          index === 0 ? { ...step, description: 'Consultando API externa...' } : step
        ));
        
        // Enviar imagem como arquivo
        const imageFormData = new FormData();
        imageFormData.append('image', imageBlob, 'placa.jpg');
        
        const response = await fetch('https://engine03.frconnect.com.br/webhook/frsend.consultar.placa', {
          method: 'POST',
          body: imageFormData
        });
        
        if (!response.ok) {
          throw new Error('Erro na consulta da API');
        }
        
        const apiData = await response.json();
        console.log("Resposta do n8n:", apiData);
        
        if (apiData && apiData.veiculo) {
          const veiculo = apiData.veiculo;
          const placaDetectada = veiculo.placa;
          
          if (!veiculo || !placaDetectada) {
            throw new Error('Dados do veículo não encontrados');
          }
          
          // Verificar se a placa já existe no cache
          setSteps(prev => prev.map((step, index) => 
            index === 0 ? { ...step, description: 'Verificando cache local...' } : step
          ));
          
          const { data: veiculoCache, error: cacheError } = await supabase
            .from('veiculos')
            .select('*')
            .eq('placa', placaDetectada)
            .maybeSingle();
          
          let vehicleData;
          let idplaca;
          
          if (!cacheError && veiculoCache) {
            // ✅ ENCONTRADO NO CACHE
            console.log('Placa encontrada no cache:', veiculoCache);
            
            setSteps(prev => prev.map((step, index) => 
              index === 0 ? { ...step, status: 'completed', description: '✓ Dados encontrados no cache!' } : step
            ));
            
            vehicleData = {
              placa: veiculoCache.placa,
              marca: veiculoCache.marca,
              modelo: veiculoCache.modelo,
              submodelo: veiculoCache.submodelo,
              versao: veiculoCache.versao,
              ano: veiculoCache.ano,
              anoModelo: veiculoCache.anomodelo,
              cor: veiculoCache.cor,
              municipio: veiculoCache.municipio,
              uf: veiculoCache.uf,
              imagem: capturedImage,
              hora_chegada: new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              fonte: 'cache',
              idplaca: veiculoCache.idplaca
            };
            
            idplaca = veiculoCache.idplaca;
          } else {
            // ❌ NÃO ENCONTRADO - Salvar no cache
            console.log('Placa não encontrada no cache, salvando...');
            
            setSteps(prev => prev.map((step, index) => 
              index === 0 ? { ...step, description: 'Salvando no cache...' } : step
            ));
            
            const { data: novoVeiculo, error: insertError } = await supabase
              .from('veiculos')
              .insert({
                placa: veiculo.placa,
                marca: veiculo.marca || null,
                modelo: veiculo.modelo || null,
                submodelo: veiculo.submodelo || null,
                versao: veiculo.versao || null,
                ano: veiculo.ano || null,
                anomodelo: veiculo.anoModelo || null,
                cor: veiculo.cor || null,
                municipio: veiculo.municipio || null,
                uf: veiculo.uf || null
              })
              .select()
              .single();
            
            if (insertError) {
              console.error('Erro ao salvar veículo no cache:', insertError);
            }
            
            setSteps(prev => prev.map((step, index) => 
              index === 0 ? { ...step, status: 'completed', description: '✓ Dados obtidos da API!' } : step
            ));
            
            vehicleData = {
              placa: veiculo.placa || 'NÃO IDENTIFICADA',
              marca: veiculo.marca || '',
              modelo: veiculo.modelo || veiculo.submodelo || '',
              submodelo: veiculo.submodelo || '',
              versao: veiculo.versao || '',
              ano: veiculo.ano || veiculo.anoModelo || '',
              anoModelo: veiculo.anoModelo || '',
              cor: veiculo.cor || '',
              municipio: veiculo.municipio || '',
              uf: veiculo.uf || '',
              imagem: capturedImage,
              hora_chegada: new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              fonte: 'api_n8n',
              idplaca: novoVeiculo?.idplaca
            };
            
            idplaca = novoVeiculo?.idplaca;
          }
          
          setCurrentStep(1);
          
          // Etapa 2: Solicitar dados do cliente
          setSteps(prev => prev.map((step, index) => 
            index === 1 ? { ...step, status: 'processing' } : step
          ));

          onRequestClientData(vehicleData);
        } else {
          throw new Error('Resposta inválida da API');
        }
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        
        // Marcar como erro
        setSteps(prev => prev.map((step, index) => 
          index === 0 ? { ...step, status: 'error', description: 'Erro ao consultar placa' } : step
        ));
        
        // Permitir entrada manual
        const vehicleData = {
          placa: "NÃO IDENTIFICADA",
          imagem: capturedImage,
          hora_chegada: new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          fonte: 'manual'
        };

        // Após 2 segundos, abrir modal de dados do cliente
        setTimeout(() => {
          setCurrentStep(1);
          setSteps(prev => prev.map((step, index) => 
            index === 1 ? { ...step, status: 'processing' } : step
          ));
          onRequestClientData(vehicleData);
        }, 2000);
      }
    };

    processSteps();
  }, [isOpen, capturedImage, onComplete, onRequestClientData]);

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
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto [&>button]:hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-wash-blue mb-2">
              🔍 Processando Dados
            </h2>
            <p className="text-muted-foreground text-sm">
              Analisando a imagem e coletando informações...
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
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
                    {step.status === 'completed' && (
                      <div className="text-wash-green">
                        ✓
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={steps.some(s => s.status === 'processing')}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};