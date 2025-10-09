import React, { useRef, useState, useCallback } from "react";
import { Camera, RotateCcw, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ProcessingModal } from "@/components/ProcessingModal";
import { ClientDataModal } from "@/components/ClientDataModal";

const CameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [vehicleDataForClient, setVehicleDataForClient] = useState<any>(null);
  const navigate = useNavigate();

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

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
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
              {!isStreamActive ? (
                <Button
                  onClick={startCamera}
                  variant="camera"
                  size="lg"
                  className="w-full"
                >
                  <Camera className="h-5 w-5" />
                  Iniciar Câmera
                </Button>
              ) : (
                <Button
                  onClick={capturePhoto}
                  variant="camera"
                  size="lg"
                  className="w-full"
                >
                  <Camera className="h-5 w-5" />
                  Capturar Foto
                </Button>
              )}
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