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

  // stream em STATE para acionar o useEffect que conecta ao <video>
  // stream em REF para stopCamera não ter stale closure
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [vehicleDataForClient, setVehicleDataForClient] = useState<any>(null);
  const [manualPlate, setManualPlate] = useState("");
  const [isSearchingPlate, setIsSearchingPlate] = useState(false);
  const navigate = useNavigate();

  // ─── Conecta o stream ao elemento <video> APÓS o render do React ──────────
  // Isso garante que videoRef.current já está no DOM quando atribuímos srcObject.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;

    if (stream) {
      // play() pode falhar em alguns browsers mobile se o user não interagiu
      // ainda — tratamos silenciosamente
      video.play().catch((err) => {
        console.warn("video.play() warning:", err?.name, err?.message);
      });
    }
  }, [stream]);

  // ─── Limpeza ao desmontar ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ─── Quando o vídeo está pronto para reproduzir ───────────────────────────
  const handleVideoCanPlay = useCallback(() => {
    // Só ativa se ainda temos stream (evita race condition após stopCamera)
    if (streamRef.current) {
      setIsCameraActive(true);
      setIsCameraLoading(false);
    }
  }, []);

  // ─── Stop: usa REF para não ter stale closure ─────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsCameraActive(false);
    setIsCameraLoading(false);
  }, []);

  // ─── Start: lógica simplificada e robusta ─────────────────────────────────
  const startCamera = useCallback(async () => {
    // Para qualquer stream existente antes de iniciar novo
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        title: "Câmera indisponível",
        description:
          "O navegador requer HTTPS para acessar a câmera. Use 'Carregar Imagem' como alternativa.",
        variant: "destructive",
      });
      return;
    }

    setIsCameraLoading(true);
    setIsCameraActive(false);

    try {
      let mediaStream: MediaStream;
      let usedFront = false;

      // Tenta câmera traseira (celular). Sem constraint de resolução para maior compatibilidade.
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });

        // Detecta se ficou na câmera frontal
        const settings = mediaStream.getVideoTracks()[0]?.getSettings?.() ?? {};
        usedFront =
          settings.facingMode === "user" || settings.facingMode === undefined;
      } catch {
        // Fallback: sem constraints — compatível com qualquer dispositivo
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        usedFront = true; // Assume frontal quando sem constraints (notebook)
      }

      streamRef.current = mediaStream;
      setIsFrontCamera(usedFront);
      // Atualiza STATE → aciona o useEffect → conecta ao <video> após render
      setStream(mediaStream);
      // isCameraActive será true após onCanPlay
    } catch (error: any) {
      console.error("Erro ao acessar câmera:", error);
      streamRef.current = null;
      setIsCameraLoading(false);

      const denied =
        error?.name === "NotAllowedError" ||
        error?.name === "PermissionDeniedError";

      toast({
        title: denied ? "Permissão negada" : "Erro ao acessar a câmera",
        description: denied
          ? "Permita o acesso à câmera nas configurações do navegador e tente novamente."
          : "Não foi possível ativar a câmera. Use 'Carregar Imagem' como alternativa.",
        variant: "destructive",
      });
    }
  }, []);

  // ─── Captura ──────────────────────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;

    if (!w || !h) {
      toast({
        title: "Câmera ainda carregando",
        description: "Aguarde a câmera inicializar e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Espelha se câmera frontal
    if (isFrontCamera) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Escala de cinza + contraste leve para OCR
    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const contrast = 30;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const v = Math.max(0, Math.min(255, factor * (gray - 128) + 128));
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.error("Filtro de imagem falhou:", e);
    }

    setCapturedImage(canvas.toDataURL("image/jpeg", 0.95));
    stopCamera();
  }, [stopCamera, isFrontCamera]);

  // ─── Upload de imagem ─────────────────────────────────────────────────────
  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = "";

      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 1920;
          let { width: w, height: h } = img;
          if (w > MAX || h > MAX) {
            const r = Math.min(MAX / w, MAX / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { setCapturedImage(rawUrl); stopCamera(); return; }

          ctx.drawImage(img, 0, 0, w, h);
          try {
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            const contrast = 30;
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            for (let i = 0; i < d.length; i += 4) {
              const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              const v = Math.max(0, Math.min(255, factor * (gray - 128) + 128));
              d[i] = v; d[i + 1] = v; d[i + 2] = v;
            }
            ctx.putImageData(imgData, 0, 0);
          } catch { /* usa imagem sem filtro */ }
          setCapturedImage(canvas.toDataURL("image/jpeg", 0.95));
          stopCamera();
        };
        img.onerror = () => { setCapturedImage(rawUrl); stopCamera(); };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    },
    [stopCamera]
  );

  // ─── Demais handlers ──────────────────────────────────────────────────────
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) setShowProcessingModal(true);
  }, [capturedImage]);

  const handleManualSearch = useCallback(async () => {
    if (manualPlate.length < 7) return;
    setIsSearchingPlate(true);
    try {
      const { data: veiculoCache, error: cacheError } = await supabase
        .from("veiculos")
        .select("*")
        .eq("placa", manualPlate)
        .maybeSingle();

      let vehicleData;
      const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      if (!cacheError && veiculoCache) {
        vehicleData = {
          placa: veiculoCache.placa,
          marca: veiculoCache.marca || "",
          modelo: veiculoCache.modelo || "",
          submodelo: veiculoCache.submodelo || "",
          versao: veiculoCache.versao || "",
          ano: veiculoCache.ano || "",
          anoModelo: veiculoCache.anomodelo || "",
          cor: veiculoCache.cor || "",
          municipio: veiculoCache.municipio || "",
          uf: veiculoCache.uf || "",
          imagem: null,
          hora_chegada: hora,
          fonte: "cache",
          idplaca: veiculoCache.idplaca,
        };
      } else {
        const { data: novoVeiculo, error: insertError } = await supabase
          .from("veiculos")
          .insert({ placa: manualPlate })
          .select()
          .single();
        if (insertError) console.error("Erro ao salvar veículo manual:", insertError);
        vehicleData = {
          placa: manualPlate,
          marca: "", modelo: "", submodelo: "", versao: "",
          ano: "", anoModelo: "", cor: "", municipio: "", uf: "",
          imagem: null, hora_chegada: hora, fonte: "manual",
          idplaca: novoVeiculo?.idplaca,
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

  const handleProcessingComplete = useCallback((result: any) => {
    setShowProcessingModal(false);
    navigate("/vehicle-details", { state: result });
  }, [navigate]);

  const handleProcessingCancel = useCallback(() => setShowProcessingModal(false), []);

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

  // ─── Render ───────────────────────────────────────────────────────────────
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
            <h1 className="text-xl font-bold text-wash-blue">📷 Capturar Placa</h1>
          </div>

          {/* Área da câmera / imagem */}
          <Card className="mb-3 overflow-hidden shadow-soft">
            <div className="relative aspect-[4/3] bg-gray-900">
              {!capturedImage ? (
                <>
                  {/* Vídeo SEMPRE no DOM para que o useEffect possa atribuir srcObject */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onCanPlay={handleVideoCanPlay}
                    className={`w-full h-full object-cover ${
                      isFrontCamera ? "scale-x-[-1]" : ""
                    }`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Overlay de enquadramento (só quando câmera ativa) */}
                  {isCameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-white/80 rounded-lg w-3/4 h-1/3 flex items-center justify-center">
                        <span className="text-white/80 text-xs font-medium bg-black/30 px-2 py-0.5 rounded">
                          Posicione a placa aqui
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Badge câmera frontal */}
                  {isCameraActive && isFrontCamera && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded">
                      📷 Câmera frontal
                    </div>
                  )}

                  {/* Spinner de loading */}
                  {isCameraLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                      <Loader2 className="h-10 w-10 text-white animate-spin mb-2" />
                      <span className="text-white text-sm font-medium">
                        Iniciando câmera...
                      </span>
                    </div>
                  )}

                  {/* Placeholder quando câmera não está ativa nem carregando */}
                  {!isCameraActive && !isCameraLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <Camera className="h-12 w-12 mb-2 opacity-30" />
                      <span className="text-xs opacity-50">Câmera desligada</span>
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

          {/* Botões de ação */}
          <div className="space-y-2">
            {!capturedImage ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={isCameraActive ? capturePhoto : startCamera}
                  disabled={isCameraLoading}
                  variant="camera"
                  size="lg"
                  className={`w-full h-11 text-sm transition-all duration-200 ${
                    isCameraActive
                      ? "bg-wash-blue text-white hover:bg-wash-blue/90 shadow-lg"
                      : ""
                  }`}
                >
                  {isCameraLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {isCameraLoading
                    ? "Iniciando câmera..."
                    : isCameraActive
                    ? "📸 Capturar Foto"
                    : "Iniciar Câmera"}
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
          {/* Entrada manual */}
          <Card className="mt-3 p-3 shadow-soft border-wash-blue/10 bg-white">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-wash-blue">
                Sem câmera? Digite a placa manualmente
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="ABC1D23"
                  value={manualPlate}
                  onChange={(e) =>
                    setManualPlate(
                      e.target.value
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .substring(0, 7)
                        .toUpperCase()
                    )
                  }
                  className="font-mono text-center text-base tracking-widest uppercase flex-1 h-9 border-wash-blue/20 focus-visible:ring-wash-blue"
                  maxLength={7}
                />
                <Button
                  onClick={handleManualSearch}
                  disabled={manualPlate.length < 7 || isSearchingPlate}
                  className="bg-wash-blue hover:bg-wash-blue/90 h-9 px-4 text-xs font-medium text-white"
                >
                  {isSearchingPlate ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Buscar"
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Dicas */}
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

        {/* Modais */}
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