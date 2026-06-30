import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Phone, MapPin, MessageSquare, Sparkles, Smartphone, Save, RotateCcw, Check, Loader2 } from 'lucide-react';
import { getCompanyConfigApi, saveCompanyConfigApi, CompanyConfig, listZapMessagesApi, saveZapMessageApi, ZapMessage } from '@/services/clientApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function ConfiguracoesEmpresa() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyConfig>({
    cnpj: '',
    email: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    cidade: '',
    uf: '',
    bairro: '',
    nomeempresa: '',
    descricao: ''
  });

  // WhatsApp Messages States
  const [messages, setMessages] = useState<ZapMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [savingMessage, setSavingMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ZapMessage | null>(null);
  const [tempMessage, setTempMessage] = useState<ZapMessage | null>(null);

  useEffect(() => {
    loadCompanyData();
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const data = await listZapMessagesApi();
      setMessages(data);
      if (data.length > 0) {
        setSelectedMessage(data[0]);
        setTempMessage(data[0]);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar mensagens',
        description: error.message || 'Erro ao carregar mensagens automáticas.',
        variant: 'destructive'
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSaveMessage = async () => {
    if (!tempMessage) return;
    setSavingMessage(true);
    try {
      await saveZapMessageApi(tempMessage);
      toast({
        title: 'Sucesso!',
        description: 'Template de mensagem automática atualizado com sucesso.'
      });
      setMessages(prev => prev.map(m => m.codigo === tempMessage.codigo ? tempMessage : m));
      setSelectedMessage(tempMessage);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar mensagem',
        description: error.message || 'Não foi possível salvar a mensagem.',
        variant: 'destructive'
      });
    } finally {
      setSavingMessage(false);
    }
  };

  const handleCancelEdit = () => {
    setTempMessage(selectedMessage);
  };

  const insertVariable = (variable: string) => {
    if (!tempMessage) return;
    const textarea = document.getElementById('mensagem-texto') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = tempMessage.texto;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setTempMessage({ ...tempMessage, texto: newText });
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setTempMessage({ ...tempMessage, texto: tempMessage.texto + ' ' + variable });
    }
  };

  const getPreviewText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{nome_cliente}/g, 'João Silva')
      .replace(/{nome_lavajato}/g, companyData.nomeempresa || 'Lava Jato Central')
      .replace(/{tempo_previsao}/g, '45 minutos');
  };


  const loadCompanyData = async () => {
    setLoading(true);
    try {
      const data = await getCompanyConfigApi();
      if (data) {
        setCompanyData({
          cnpj: data.cnpj || '',
          email: data.email || '',
          telefone: data.telefone || '',
          cep: data.cep || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          cidade: data.cidade || '',
          uf: data.uf || '',
          bairro: data.bairro || '',
          nomeempresa: data.nomeempresa || data.descricao || '',
          descricao: data.descricao || ''
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message || 'Erro ao carregar configurações da empresa.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await saveCompanyConfigApi(companyData);
      toast({
        title: 'Sucesso!',
        description: 'Dados da empresa atualizados com sucesso.'
      });
      loadCompanyData();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Erro ao salvar configurações da empresa.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'administrador') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Apenas administradores podem acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as informações cadastrais e as mensagens automáticas de atendimento.
          </p>
        </div>
      </div>

      <Tabs defaultValue="dados-empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="dados-empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Dados da Empresa
          </TabsTrigger>
          <TabsTrigger value="mensagens-zap" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens Padrão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados-empresa">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Atualize os dados cadastrais da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="space-y-2 md:col-span-8">
                    <Label htmlFor="nomeempresa">
                      <Building2 className="inline h-4 w-4 mr-2" />
                      Nome da Empresa
                    </Label>
                    <Input
                      id="nomeempresa"
                      value={companyData.nomeempresa || ''}
                      onChange={(e) => setCompanyData({ ...companyData, nomeempresa: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-4">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={companyData.cnpj}
                      onChange={(e) => setCompanyData({ ...companyData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-6">
                    <Label htmlFor="email">
                      <Mail className="inline h-4 w-4 mr-2" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-6">
                    <Label htmlFor="telefone">
                      <Phone className="inline h-4 w-4 mr-2" />
                      Telefone
                    </Label>
                    <Input
                      id="telefone"
                      value={companyData.telefone}
                      onChange={(e) => setCompanyData({ ...companyData, telefone: e.target.value })}
                      placeholder="(00) 0000-0000"
                    />
                  </div>

                  {/* Endereço detalhado */}
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="cep">
                      <MapPin className="inline h-4 w-4 mr-2" />
                      CEP
                    </Label>
                    <Input
                      id="cep"
                      value={companyData.cep}
                      onChange={(e) => setCompanyData({ ...companyData, cep: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-6">
                    <Label htmlFor="logradouro">Logradouro (Rua/Avenida)</Label>
                    <Input
                      id="logradouro"
                      value={companyData.logradouro}
                      onChange={(e) => setCompanyData({ ...companyData, logradouro: e.target.value })}
                      placeholder="Rua..."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={companyData.numero}
                      onChange={(e) => setCompanyData({ ...companyData, numero: e.target.value })}
                      placeholder="123"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-4">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={companyData.complemento}
                      onChange={(e) => setCompanyData({ ...companyData, complemento: e.target.value })}
                      placeholder="Apto, Sala, etc."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={companyData.bairro}
                      onChange={(e) => setCompanyData({ ...companyData, bairro: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={companyData.cidade}
                      onChange={(e) => setCompanyData({ ...companyData, cidade: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="uf">UF</Label>
                    <Input
                      id="uf"
                      value={companyData.uf}
                      onChange={(e) => setCompanyData({ ...companyData, uf: e.target.value })}
                      placeholder="RN"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={loadCompanyData}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="mensagens-zap">
          {loadingMessages ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Carregando mensagens automáticas...</p>
            </div>
          ) : messages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Nenhuma mensagem encontrada
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                  Não foi possível encontrar templates de mensagens de WhatsApp cadastrados no sistema.
                </p>
                <Button onClick={loadMessages} variant="outline">
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Mensagens Padrão de Atendimento
                </CardTitle>
                <CardDescription>
                  Personalize os templates das mensagens enviadas automaticamente aos clientes via WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Painel Esquerdo: Lista de Mensagens */}
                  <div className="md:col-span-4 lg:col-span-3 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">
                      Modelos de Mensagem
                    </h3>
                    <div className="space-y-2">
                      {messages.map((msg) => {
                        const isSelected = selectedMessage?.codigo === msg.codigo;
                        return (
                          <button
                            key={msg.codigo}
                            type="button"
                            onClick={() => {
                              setSelectedMessage(msg);
                              setTempMessage(msg);
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm font-medium'
                                : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                            }`}
                          >
                            <div className="mb-1 text-sm text-foreground truncate">
                              {msg.titulo}
                            </div>
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                              {msg.codigo}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Painel Direito: Editor & Prévia */}
                  <div className="md:col-span-8 lg:col-span-9">
                    {selectedMessage && tempMessage && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Editor */}
                        <div className="lg:col-span-8 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="mensagem-titulo" className="text-xs">Título do Modelo</Label>
                              <Input
                                id="mensagem-titulo"
                                value={tempMessage.titulo || ''}
                                onChange={(e) => setTempMessage({ ...tempMessage, titulo: e.target.value })}
                                className="h-9 text-sm"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="mensagem-codigo" className="text-xs">Identificador do Sistema</Label>
                              <Input
                                id="mensagem-codigo"
                                value={tempMessage.codigo || ''}
                                disabled
                                className="bg-muted font-mono text-xs text-muted-foreground cursor-not-allowed h-9"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="mensagem-texto" className="text-xs">Texto da Mensagem</Label>
                              <span className="text-[10px] text-muted-foreground">
                                Quebras de linha e emojis são mantidos
                              </span>
                            </div>
                            <Textarea
                              id="mensagem-texto"
                              value={tempMessage.texto || ''}
                              onChange={(e) => setTempMessage({ ...tempMessage, texto: e.target.value })}
                              rows={8}
                              className="font-sans text-sm resize-none focus-visible:ring-1 focus-visible:ring-primary"
                            />
                          </div>

                          {/* Variáveis Dinâmicas */}
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-[11px] text-muted-foreground block">
                              Campos Dinâmicos (Clique para inserir no cursor):
                            </Label>
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable('{nome_cliente}')}
                                className="h-6 text-[10px] font-mono px-2 bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1 border-dashed"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                &#123;nome_cliente&#125;
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable('{nome_lavajato}')}
                                className="h-6 text-[10px] font-mono px-2 bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1 border-dashed"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                &#123;nome_lavajato&#125;
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable('{tempo_previsao}')}
                                className="h-6 text-[10px] font-mono px-2 bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1 border-dashed"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                &#123;tempo_previsao&#125;
                              </Button>
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex justify-end gap-3 pt-3 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={savingMessage}
                              className="flex items-center gap-2 h-9 text-xs"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Descartar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveMessage}
                              disabled={savingMessage}
                              className="flex items-center gap-2 h-9 text-xs"
                            >
                              {savingMessage ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                <>
                                  <Save className="h-3.5 w-3.5" />
                                  Salvar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Simulador de WhatsApp Compacto */}
                        <div className="lg:col-span-4 flex flex-col justify-start">
                          <div className="text-[11px] font-semibold text-muted-foreground mb-2 px-1 flex items-center gap-1.5">
                            <Smartphone className="h-3.5 w-3.5" />
                            Prévia no WhatsApp
                          </div>
                          
                          {/* Corpo do Celular WhatsApp Compacto */}
                          <div className="border border-border rounded-[24px] p-1.5 bg-card shadow-md max-w-[220px] mx-auto w-full">
                            <div className="border-2 border-slate-800 rounded-[18px] overflow-hidden bg-[#efeae2] flex flex-col h-[320px] relative font-sans">
                              {/* Barra do Topo (Notch) */}
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-3 bg-slate-800 rounded-b-md z-20 flex items-center justify-center">
                                <div className="w-8 h-0.5 bg-slate-700 rounded-full mb-0.5"></div>
                              </div>

                              {/* Cabeçalho do Chat do WhatsApp */}
                              <div className="bg-[#075e54] text-white px-2 pt-4 pb-1.5 flex items-center gap-1.5 z-10 shadow-sm">
                                <div className="h-6 w-6 rounded-full bg-slate-300 flex items-center justify-center text-slate-800 font-bold uppercase text-[9px] shadow-inner">
                                  {companyData.nomeempresa ? companyData.nomeempresa.substring(0, 2) : 'LJ'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[10px] font-semibold truncate leading-tight">
                                    {companyData.nomeempresa || 'Lava Jato Central'}
                                  </h4>
                                  <span className="text-[7.5px] text-emerald-200 leading-none block">online</span>
                                </div>
                              </div>

                              {/* Fundo do chat com padrão do WhatsApp */}
                              <div className="flex-1 p-2 flex flex-col justify-start bg-[#efeae2] overflow-y-auto space-y-2 pt-3">
                                <div className="bg-[#e1f3fc] text-[8px] text-slate-600 rounded p-1 self-center text-center max-w-[95%] shadow-sm border border-sky-100 leading-tight">
                                  🔒 As mensagens são criptografadas.
                                </div>

                                {/* Balão de Mensagem Recebida */}
                                <div className="bg-white text-slate-800 rounded p-2 max-w-[90%] self-start shadow-sm relative text-[9.5px] leading-snug whitespace-pre-wrap rounded-tl-none border border-slate-100">
                                  {getPreviewText(tempMessage.texto)}
                                  <div className="text-[7.5px] text-slate-400 text-right mt-1 flex items-center justify-end gap-0.5 leading-none">
                                    <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <Check className="h-2 w-2 text-sky-500 fill-sky-500" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

