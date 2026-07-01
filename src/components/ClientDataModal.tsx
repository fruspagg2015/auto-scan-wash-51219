import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { User, Phone, Car, Hash, Palette, Calendar, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { saveClientApi } from "@/services/clientApi";

interface ClientDataModalProps {
  isOpen: boolean;
  onComplete: (result: any) => void;
  onCancel: () => void;
  vehicleData: any;
}

const formatPhone = (value: any) => {
  if (!value) return "";
  const strValue = String(value);
  let digits = strValue.replace(/\D/g, '');
  // Remove o DDI 55 se vier da API
  if (digits.startsWith("55") && digits.length >= 12) {
    digits = digits.substring(2);
  }
  
  if (digits.length <= 2) {
    return `(${digits}`;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
};

export const ClientDataModal: React.FC<ClientDataModalProps> = ({
  isOpen,
  onComplete,
  onCancel,
  vehicleData
}) => {
  const { currentCompanyId } = useAuth();
  const [formData, setFormData] = useState({
    nome: vehicleData?.cliente?.nome || "",
    telefone: vehicleData?.cliente?.telefone ? formatPhone(vehicleData.cliente.telefone) : "",
    email: "",
    modelo: vehicleData?.modelo || "",
    marca: vehicleData?.marca || "",
    ano: vehicleData?.ano || "",
    cor: vehicleData?.cor || ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && vehicleData) {
      try {
        setFormData({
          nome: vehicleData.cliente?.nome || "",
          telefone: vehicleData.cliente?.telefone ? formatPhone(vehicleData.cliente.telefone) : "",
          email: "",
          modelo: vehicleData.modelo || "",
          marca: vehicleData.marca || "",
          ano: vehicleData.ano || "",
          cor: vehicleData.cor || ""
        });
        setErrors({});
      } catch (err) {
        console.error("Erro ao preencher dados do modal:", err);
      }
    }
  }, [isOpen, vehicleData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = "Telefone é obrigatório";
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.telefone)) {
      newErrors.telefone = "Formato: (11) 99999-9999";
    }

    // Se não temos dados do veículo, validar campos do veículo
    if (!vehicleData?.marca && !vehicleData?.modelo) {
      if (!formData.modelo.trim()) newErrors.modelo = "Modelo é obrigatório";
      if (!formData.marca.trim()) newErrors.marca = "Marca é obrigatória";
      if (!formData.ano.trim()) newErrors.ano = "Ano é obrigatório";
      if (!formData.cor.trim()) newErrors.cor = "Cor é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Extrair apenas os números do telefone e adicionar DDI 55, padrão do cURL de exemplo
      const telefoneSoNumeros = "55" + formData.telefone.replace(/\D/g, '');

      const payload: any = {
        nome: formData.nome,
        telefone: telefoneSoNumeros,
        email: formData.email || undefined,
        status: true
      };

      // Adicionar idcliente se for atualização
      if (vehicleData?.cliente?.id) {
        payload.idcliente = vehicleData.cliente.id;
      }

      // Adicionar idveiculo se houver
      if (vehicleData?.idplaca) {
        payload.idveiculo = vehicleData.idplaca;
        payload["idveiculo:"] = vehicleData.idplaca; // Para cobrir o typo do JSON de exemplo
      }

      // Envia para o novo endpoint da API
      const resultPayload = await saveClientApi(payload);
      console.log("ClientDataModal saveClientApi resultPayload:", resultPayload);
      console.log("ClientDataModal current vehicleData:", vehicleData);
      
      const clienteId = (resultPayload as any)?.idcliente || (resultPayload as any)?.id || vehicleData?.cliente?.id || (vehicleData?.cliente as any)?.idcliente || 0;
      console.log("ClientDataModal resolved clienteId:", clienteId);

      // 3. Retornar dados completos
      const completeData = {
        ...vehicleData,
        modelo: vehicleData?.modelo || formData.modelo,
        marca: vehicleData?.marca || formData.marca,
        ano: vehicleData?.ano || formData.ano,
        cor: vehicleData?.cor || formData.cor,
        cliente: {
          id: clienteId,
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          cadastrado: true
        },
        fonte: vehicleData?.fonte || 'manual'
      };

      toast({
        title: "✓ Dados salvos com sucesso!",
        description: "Cliente e veículo foram registrados.",
      });

      onComplete(completeData);
    } catch (error: any) {
      console.error('Erro ao processar dados:', error);
      toast({
        title: "Erro ao processar dados",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    handleInputChange('telefone', formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-wash-blue flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados do Cliente e Veículo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-1">
          {/* Informações da Placa */}
          <Card className="bg-wash-blue-light/20 border-wash-blue/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-wash-blue" />
                  <div>
                    <p className="text-sm text-muted-foreground">Placa detectada</p>
                    <Badge variant="default" className="bg-wash-blue text-white font-mono">
                      {vehicleData?.placa}
                    </Badge>
                  </div>
                </div>
                {vehicleData?.fonte && (
                  <Badge 
                    variant={vehicleData.fonte === 'cache' ? 'default' : 'secondary'}
                    className={
                      vehicleData.fonte === 'cache' 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                  >
                    {vehicleData.fonte === 'cache' ? '💾 CACHE' : '🌐 API'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dados do Cliente */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados do Cliente
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  placeholder="Digite o nome do cliente"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className={errors.nome ? 'border-destructive' : ''}
                />
                {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome}</p>}
              </div>

              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={errors.telefone ? 'border-destructive' : ''}
                />
                {errors.telefone && <p className="text-xs text-destructive mt-1">{errors.telefone}</p>}
              </div>

              <div>
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dados do Veículo - só mostrar se não temos dados da API */}
          {(!vehicleData?.marca && !vehicleData?.modelo) && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Car className="h-4 w-4" />
                Dados do Veículo
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="marca">Marca *</Label>
                  <Input
                    id="marca"
                    placeholder="Toyota"
                    value={formData.marca}
                    onChange={(e) => handleInputChange('marca', e.target.value)}
                    className={errors.marca ? 'border-destructive' : ''}
                  />
                  {errors.marca && <p className="text-xs text-destructive mt-1">{errors.marca}</p>}
                </div>

                <div>
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input
                    id="modelo"
                    placeholder="Corolla"
                    value={formData.modelo}
                    onChange={(e) => handleInputChange('modelo', e.target.value)}
                    className={errors.modelo ? 'border-destructive' : ''}
                  />
                  {errors.modelo && <p className="text-xs text-destructive mt-1">{errors.modelo}</p>}
                </div>

                <div>
                  <Label htmlFor="ano">Ano *</Label>
                  <Input
                    id="ano"
                    placeholder="2023"
                    value={formData.ano}
                    onChange={(e) => handleInputChange('ano', e.target.value)}
                    className={errors.ano ? 'border-destructive' : ''}
                  />
                  {errors.ano && <p className="text-xs text-destructive mt-1">{errors.ano}</p>}
                </div>

                <div>
                  <Label htmlFor="cor">Cor *</Label>
                  <Input
                    id="cor"
                    placeholder="Prata"
                    value={formData.cor}
                    onChange={(e) => handleInputChange('cor', e.target.value)}
                    className={errors.cor ? 'border-destructive' : ''}
                  />
                  {errors.cor && <p className="text-xs text-destructive mt-1">{errors.cor}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Se temos dados do veículo da API, mostrar resumo */}
          {(vehicleData?.marca || vehicleData?.modelo) && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Dados do Veículo Encontrados
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(vehicleData.marca || vehicleData.modelo) && (
                    <div className="flex items-center gap-2">
                      <Car className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-wash-blue">
                        {vehicleData.marca} {vehicleData.modelo}
                      </span>
                    </div>
                  )}
                  {vehicleData.ano && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{vehicleData.ano}{vehicleData.anoModelo ? ` / ${vehicleData.anoModelo}` : ''}</span>
                    </div>
                  )}
                  {vehicleData.uf && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span>{vehicleData.uf}</span>
                    </div>
                  )}
                  {vehicleData.cor && (
                    <div className="flex items-center gap-2">
                      <Palette className="h-3 w-3 text-muted-foreground" />
                      <span>{vehicleData.cor}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1 bg-wash-blue hover:bg-wash-blue/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};