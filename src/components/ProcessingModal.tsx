import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Camera, Database, Globe, UserPlus, CheckCircle } from "lucide-react";

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
      id: 'ocr',
      title: 'Escaneando placa',
      description: 'Analisando a imagem capturada...',
      icon: <Camera className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'local',
      title: 'Consultando cadastro',
      description: 'Verificando dados no sistema...',
      icon: <Database className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'api',
      title: 'Consultando dados do veículo',
      description: 'Buscando informações externas...',
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
        // Step 1: OCR da placa
        setSteps(prev => prev.map((step, index) => 
          index === 0 ? { ...step, status: 'processing' } : step
        ));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        const placaDetectada = "ABC-1234"; // Mock OCR result
        
        setSteps(prev => prev.map((step, index) => 
          index === 0 ? { ...step, status: 'completed' } : step
        ));
        setCurrentStep(1);

        // Step 2: Consulta no cadastro local
        setSteps(prev => prev.map((step, index) => 
          index === 1 ? { ...step, status: 'processing' } : step
        ));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simular se encontrou no cadastro local
        const encontrouLocal = Math.random() > 0.5;
        
        if (encontrouLocal) {
          // Encontrou tudo no cadastro local
          setSteps(prev => prev.map((step, index) => 
            index === 1 ? { ...step, status: 'completed' } : 
            index > 1 ? { ...step, status: 'completed' } : step
          ));
          
          const mockResult = {
            placa: placaDetectada,
            modelo: "Civic",
            marca: "Honda",
            ano: "2022",
            cor: "Prata",
            imagem: capturedImage,
            hora_chegada: new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            cliente: {
              nome: "João Silva",
              telefone: "(11) 99999-1234",
              email: "joao.silva@email.com",
              cadastrado: true
            },
            fonte: 'cadastro_local'
          };
          
          setTimeout(() => onComplete(mockResult), 1000);
          return;
        }

        setSteps(prev => prev.map((step, index) => 
          index === 1 ? { ...step, status: 'completed' } : step
        ));
        setCurrentStep(2);

        // Step 3: Consulta API externa
        setSteps(prev => prev.map((step, index) => 
          index === 2 ? { ...step, status: 'processing' } : step
        ));
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const encontrouAPI = Math.random() > 0.3;
        
        if (encontrouAPI) {
          setSteps(prev => prev.map((step, index) => 
            index === 2 ? { ...step, status: 'completed' } : step
          ));
          setCurrentStep(3);

          // Step 4: Solicitar dados do cliente
          setSteps(prev => prev.map((step, index) => 
            index === 3 ? { ...step, status: 'processing' } : step
          ));

          const vehicleData = {
            placa: placaDetectada,
            modelo: "Onix",
            marca: "Chevrolet",
            ano: "2023",
            cor: "Preto",
            imagem: capturedImage,
            hora_chegada: new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            fonte: 'api_externa'
          };

          onRequestClientData(vehicleData);
        } else {
          // Não encontrou em lugar nenhum
          setSteps(prev => prev.map((step, index) => 
            index === 2 ? { ...step, status: 'error' } : step
          ));
          
          const vehicleData = {
            placa: placaDetectada,
            imagem: capturedImage,
            hora_chegada: new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            fonte: 'manual'
          };

          onRequestClientData(vehicleData);
        }

      } catch (error) {
        console.error('Erro no processamento:', error);
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