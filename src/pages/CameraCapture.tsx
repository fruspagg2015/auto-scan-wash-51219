import React, { useRef, useState, useCallback } from "react";
import { Camera, RotateCcw, Check, ArrowLeft, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ProcessingModal } from "@/components/ProcessingModal";
import { ClientDataModal } from "@/components/ClientDataModal";
import { supabase } from "@/integrations/supabase/client";

const CameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [vehicleDataForClient, setVehicleDataForClient] = useState<any>(null);
  const [manualPlate, setManualPlate] = useState("");
  const [isSearchingPlate, setIsSearchingPlate] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  }, [stopCamera]);

  const handleManualSearch = useCallback(async () => {
    if (manualPlate.length < 7) return;
    setIsSearchingPlate(true);
    try {
      const { data: veiculoCache, error: cacheError } = await supabase
        .from('veiculos')
        .select('*')
        .eq('placa', manualPlate)
        .maybeSingle();

      let vehicleData;
      if (!cacheError && veiculoCache) {
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
          imagem: null,
          hora_chegada: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          fonte: 'cache',
          idplaca: veiculoCache.idplaca
        };
      } else {
        // Criar veículo apenas com a placa no banco para gerar idplaca
        const { data: novoVeiculo, error: insertError } = await supabase
          .from('veiculos')
          .insert({
            placa: manualPlate
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao salvar veículo manual:', insertError);
        }

        vehicleData = {
          placa: manualPlate,
          marca: '',
          modelo: '',
          submodelo: '',
          versao: '',
          ano: '',
          anoModelo: '',
          cor: '',
          municipio: '',
          uf: '',
          imagem: null,
          hora_chegada: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          fonte: 'manual',
          idplaca: novoVeiculo?.idplaca
        };
      }

      setVehicleDataForClient(vehicleData);
      setShowClientModal(true);
    } catch (error) {
      console.error("Erro ao buscar placa:", error);
    } finally {
      setIsSearchingPlate(false);
    }
  }, [manualPlate]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setStream(mediaStream);
      setIsStreamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Erro ao acessar a câmera:", error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreamActive(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // O overlay na tela é w-3/4 (75%) e h-1/3 (33%) centralizado.
      // Vamos recortar exatamente essa área para focar apenas na placa.
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      const cropWidth = videoWidth * 0.75;
      const cropHeight = videoHeight * 0.35; // 35% de altura para margem
      const cropX = (videoWidth - cropWidth) / 2;
      const cropY = (videoHeight - cropHeight) / 2;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      if (context) {
        // Desenha apenas a região recortada da placa
        context.drawImage(
          video,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        // Aplicar escala de cinza e contraste para otimizar leitura do OCR
        try {
          const imgData = context.getImageData(0, 0, cropWidth, cropHeight);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Escala de cinza
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Filtro de contraste moderado
            const contrast = 40; 
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            let newVal = factor * (gray - 128) + 128;
            newVal = Math.max(0, Math.min(255, newVal));

            data[i] = newVal;
            data[i + 1] = newVal;
            data[i + 2] = newVal;
          }
          context.putImageData(imgData, 0, 0);
        } catch (e) {
          console.error("Erro ao aplicar filtros:", e);
        }

        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      setShowProcessingModal(true);
    }
  }, [capturedImage]);

  const handleProcessingComplete = useCallback((result: any) => {
    setShowProcessingModal(false);
    navigate("/vehicle-details", { state: result });
  }, [navigate]);

  const handleProcessingCancel = useCallback(() => {
    setShowProcessingModal(false);
  }, []);

  const handleRequestClientData = useCallback((vehicleData: any) => {
    setShowProcessingModal(false);
    setVehicleDataForClient(vehicleData);
    setShowClientModal(true);
  }, []);

  const handleClientDataComplete = useCallback((result: any) => {
    setShowClientModal(false);
    setVehicleDataForClient(null);
    navigate("/vehicle-details", { state: result });
  }, [navigate]);

  const handleClientDataCancel = useCallback(() => {
    setShowClientModal(false);
    setVehicleDataForClient(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-wash-blue-light to-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-wash-blue">
            📷 Capturar Placa
          </h1>
        </div>

        {/* Camera/Image Display */}
        <Card className="mb-6 overflow-hidden shadow-soft">
          <div className="relative aspect-[4/3] bg-gray-100">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white/80 rounded-lg w-3/4 h-1/3 flex items-center justify-center">
                    <span className="text-white/80 text-sm font-medium bg-black/30 px-2 py-1 rounded">
                      Posicione a placa aqui
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Foto capturada"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          {!capturedImage ? (
            <>
              <div className="flex flex-col gap-3">
                {!isStreamActive ? (
                  <Button
                    onClick={startCamera}
                    variant="camera"
                    size="lg"
                    className="w-full"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Iniciar Câmera
                  </Button>
                ) : (
                  <Button
                    onClick={capturePhoto}
                    variant="camera"
                    size="lg"
                    className="w-full"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Capturar Foto
                  </Button>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="file-upload"
                />
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="w-full border-wash-blue text-wash-blue hover:bg-wash-blue/10 bg-white"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Carregar Imagem
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={retakePhoto}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <RotateCcw className="h-5 w-5" />
                Recapturar
              </Button>
              <Button
                onClick={confirmPhoto}
                variant="confirm"
                size="lg"
                className="w-full"
              >
                <Check className="h-5 w-5" />
                Confirmar
              </Button>
            </div>
          )}
        </div>

        {/* Manual Plate Entry */}
        <Card className="mt-6 p-4 shadow-soft border-wash-blue/10 bg-white">
          <div className="space-y-3">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-wash-blue">
                Sem câmera? Digite a placa manualmente
              </h3>
              <p className="text-xs text-muted-foreground">
                Buscaremos os dados do veículo no sistema.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="ABC1D23"
                value={manualPlate}
                onChange={(e) => setManualPlate(e.target.value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 7).toUpperCase())}
                className="font-mono text-center text-lg tracking-widest uppercase flex-1 h-11 border-wash-blue/20 focus-visible:ring-wash-blue"
                maxLength={7}
              />
              <Button 
                onClick={handleManualSearch} 
                disabled={manualPlate.length < 7 || isSearchingPlate}
                className="bg-wash-blue hover:bg-wash-blue/90 h-11 px-6 font-medium text-white"
              >
                {isSearchingPlate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 p-4 bg-wash-blue-light/30 border-wash-blue/20">
          <div className="text-center text-sm text-wash-blue">
            <h3 className="font-semibold mb-2">💡 Dicas para melhor captura:</h3>
            <ul className="space-y-1 text-left">
              <li>• Posicione a placa dentro do quadro</li>
              <li>• Certifique-se de ter boa iluminação</li>
              <li>• Mantenha o celular firme</li>
            </ul>
          </div>
        </Card>

        {/* Modals */}
        <ProcessingModal
          isOpen={showProcessingModal}
          onComplete={handleProcessingComplete}
          onCancel={handleProcessingCancel}
          capturedImage={capturedImage || ""}
          onRequestClientData={handleRequestClientData}
        />

        <ClientDataModal
          isOpen={showClientModal}
          onComplete={handleClientDataComplete}
          onCancel={handleClientDataCancel}
          vehicleData={vehicleDataForClient}
        />
      </div>
    </div>
  );
};

export default CameraCapture;