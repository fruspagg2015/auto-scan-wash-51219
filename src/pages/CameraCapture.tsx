import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Check, ArrowLeft, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ProcessingModal } from "@/components/ProcessingModal";
import { ClientDataModal } from "@/components/ClientDataModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [vehicleDataForClient, setVehicleDataForClient] = useState<any>(null);
  const [manualPlate, setManualPlate] = useState("");
  const [isSearchingPlate, setIsSearchingPlate] = useState(false);
  const navigate = useNavigate();

  // Sincroniza isCameraActive com o stream de forma confiável
  useEffect(() => {
    setIsCameraActive(stream !== null);
  }, [stream]);

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
    // Verificar se a API de mídia está disponível (bloqueada em HTTP fora de localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Câmera indisponível (Requer HTTPS)",
        description: "O navegador bloqueia o acesso à câmera em conexões HTTP não seguras. Por favor, acesse o sistema usando HTTPS ou utilize a opção 'Carregar Imagem'.",
        variant: "destructive"
      });
      return;
    }

    try {
      let mediaStream: MediaStream;
      let usedFrontCamera = false;

      // Primeiro tenta câmera traseira (celular). Se não existir, usa qualquer câmera (notebook).
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        // Verifica se realmente obteve câmera traseira ou foi fallback para frontal
        const track = mediaStream.getVideoTracks()[0];
        const settings = track.getSettings();
        usedFrontCamera = settings.facingMode === "user" || !settings.facingMode;
      } catch (e) {
        console.warn("Câmera traseira não disponível, usando câmera do notebook:", e);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        usedFrontCamera = true;
      }

      setIsFrontCamera(usedFrontCamera);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Erro ao acessar a câmera:", error);
      toast({
        title: "Erro ao acessar a câmera",
        description: "Não foi possível ativar a câmera. Verifique as permissões ou use 'Carregar Imagem'.",
        variant: "destructive"
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;

      // Pré-processar a imagem carregada pelo mesmo pipeline da câmera
      // para garantir que o OCR receba uma imagem otimizada
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");

        // Limitar resolução máxima a 1920px para não sobrecarregar o OCR
        const MAX_DIM = 1920;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setCapturedImage(rawDataUrl);
          stopCamera();
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Aplicar escala de cinza + contraste leve (igual ao pipeline da câmera)
        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const contrast = 30;
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            let newVal = factor * (gray - 128) + 128;
            newVal = Math.max(0, Math.min(255, newVal));
            data[i] = newVal;
            data[i + 1] = newVal;
            data[i + 2] = newVal;
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (err) {
          console.error("Erro ao pré-processar imagem carregada:", err);
        }

        const processed = canvas.toDataURL("image/jpeg", 0.95);
        setCapturedImage(processed);
        stopCamera();
      };
      img.onerror = () => {
        // Fallback: usa a imagem bruta se não conseguir processar
        setCapturedImage(rawDataUrl);
        stopCamera();
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  }, [stopCamera]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Garante que o vídeo já tem dimensões válidas antes de capturar
      if (!videoWidth || !videoHeight) {
        toast({
          title: "Câmera ainda carregando",
          description: "Aguarde a câmera inicializar completamente e tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Captura o frame inteiro para não perder a placa por desalinhamento.
      // O OCR recebe a imagem completa e o Tesseract localiza os caracteres.
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      if (context) {
        // Corrige espelhamento da câmera frontal de notebook
        if (isFrontCamera) {
          context.translate(videoWidth, 0);
          context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, videoWidth, videoHeight);

        // Resetar transformação antes de ler os pixels
        context.setTransform(1, 0, 0, 1, 0, 0);

        // Aplicar escala de cinza e contraste leve para melhorar OCR
        try {
          const imgData = context.getImageData(0, 0, videoWidth, videoHeight);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Escala de cinza
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            // Contraste leve para não destruir detalhes
            const contrast = 30;
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

        const imageData = canvas.toDataURL("image/jpeg", 0.95);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera, isFrontCamera]);

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
    <div className="min-h-screen bg-gradient-to-br from-wash-blue-light to-background p-3 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center gap-4 mb-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-wash-blue">
              📷 Capturar Placa
            </h1>
          </div>

          {/* Camera/Image Display */}
          <Card className="mb-3 overflow-hidden shadow-soft">
            <div className="relative aspect-[4/3] bg-gray-100">
              {!capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      isFrontCamera ? "scale-x-[-1]" : ""
                    }`}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Camera Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-white/80 rounded-lg w-3/4 h-1/3 flex items-center justify-center">
                      <span className="text-white/80 text-xs font-medium bg-black/30 px-2 py-0.5 rounded">
                        Posicione a placa aqui
                      </span>
                    </div>
                  </div>
                  {isFrontCamera && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded">
                      📷 Câmera frontal
                    </div>
                  )}
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
          <div className="space-y-2">
            {!capturedImage ? (
              <>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={isCameraActive ? capturePhoto : startCamera}
                    variant="camera"
                    size="lg"
                    className={`w-full h-11 text-sm transition-all duration-200 ${
                      isCameraActive
                        ? "bg-wash-blue text-white hover:bg-wash-blue/90 shadow-lg"
                        : ""
                    }`}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {isCameraActive ? "📸 Capturar Foto" : "Iniciar Câmera"}
                  </Button>

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
                    className="w-full h-11 text-sm border-wash-blue text-wash-blue hover:bg-wash-blue/10 bg-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar Imagem
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  size="lg"
                  className="w-full h-11 text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Recapturar
                </Button>
                <Button
                  onClick={confirmPhoto}
                  variant="confirm"
                  size="lg"
                  className="w-full h-11 text-sm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* Manual Plate Entry */}
          <Card className="mt-3 p-3 shadow-soft border-wash-blue/10 bg-white">
            <div className="space-y-2">
              <div className="flex flex-col">
                <h3 className="text-xs font-semibold text-wash-blue">
                  Sem câmera? Digite a placa manualmente
                </h3>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="ABC1D23"
                  value={manualPlate}
                  onChange={(e) => setManualPlate(e.target.value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 7).toUpperCase())}
                  className="font-mono text-center text-base tracking-widest uppercase flex-1 h-9 border-wash-blue/20 focus-visible:ring-wash-blue"
                  maxLength={7}
                />
                <Button 
                  onClick={handleManualSearch} 
                  disabled={manualPlate.length < 7 || isSearchingPlate}
                  className="bg-wash-blue hover:bg-wash-blue/90 h-9 px-4 text-xs font-medium text-white"
                >
                  {isSearchingPlate ? <Loader2 className="h-3 w-3 animate-spin" /> : "Buscar"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="mt-3 p-2.5 bg-wash-blue-light/30 border-wash-blue/20">
            <div className="text-center text-xs text-wash-blue">
              <h3 className="font-semibold mb-1">💡 Dicas para melhor captura:</h3>
              <ul className="space-y-0.5 text-left inline-block">
                <li>• Posicione a placa dentro do quadro</li>
                <li>• Certifique-se de ter boa iluminação e foco</li>
              </ul>
            </div>
          </Card>
        </div>

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