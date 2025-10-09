import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function ConfiguracoesEmpresa() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    logo_url: ''
  });

  useEffect(() => {
    if (user?.companyId) {
      loadCompanyData();
    }
  }, [user?.companyId]);

  const loadCompanyData = async () => {
    if (!user?.companyId) return;

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', user.companyId)
      .single();

    if (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    if (data) {
      setCompanyData({
        name: data.name || '',
        cnpj: data.cnpj || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        logo_url: data.logo_url || ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    setLoading(true);

    const { error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('id', user.companyId);

    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Sucesso!',
      description: 'Dados da empresa atualizados com sucesso.'
    });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <Building2 className="inline h-4 w-4 mr-2" />
                  Nome da Empresa
                </Label>
                <Input
                  id="name"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={companyData.cnpj}
                  onChange={(e) => setCompanyData({ ...companyData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="inline h-4 w-4 mr-2" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Endereço
                </Label>
                <Input
                  id="address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
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
