import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import { getCompanyConfigApi, saveCompanyConfigApi, CompanyConfig } from '@/services/clientApi';

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

  useEffect(() => {
    loadCompanyData();
  }, []);

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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações da Empresa</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as informações da sua empresa
        </p>
      </div>

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
    </div>
  );
}
