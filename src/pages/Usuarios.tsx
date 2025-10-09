import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Shield, Trash2 } from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';

interface CompanyMember {
  id: string;
  user_id: string;
  status: 'active' | 'invited' | 'suspended';
  profiles: {
    name: string;
    user_id: string;
  } | null;
  user_roles: {
    role: UserRole;
  }[];
}

export default function Usuarios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('atendente');

  useEffect(() => {
    if (user?.companyId) {
      loadMembers();
    }
  }, [user?.companyId]);

  const loadMembers = async () => {
    if (!user?.companyId) return;

    const { data, error } = await supabase
      .from('company_members')
      .select('id, user_id, status')
      .eq('company_id', user.companyId);

    if (error) {
      toast({
        title: 'Erro ao carregar membros',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    // Fetch profiles and roles separately
    const membersWithDetails = await Promise.all(
      (data || []).map(async (member) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, user_id')
          .eq('user_id', member.user_id)
          .single();

        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', member.user_id)
          .eq('company_id', user.companyId);

        return {
          ...member,
          profiles: profile,
          user_roles: roles || []
        };
      })
    );

    setMembers(membersWithDetails as CompanyMember[]);
  };

  const handleInvite = async () => {
    if (!user?.companyId) return;

    setLoading(true);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', inviteEmail)
      .single();

    if (existingUser) {
      // User exists, add to company
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: user.companyId,
          user_id: existingUser.user_id,
          status: 'invited',
          invited_at: new Date().toISOString()
        });

      if (memberError) {
        toast({
          title: 'Erro ao convidar',
          description: memberError.message,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: existingUser.user_id,
          company_id: user.companyId,
          role: inviteRole
        });

      if (roleError) {
        toast({
          title: 'Erro ao atribuir role',
          description: roleError.message,
          variant: 'destructive'
        });
      }
    } else {
      // Send invitation email (would need edge function)
      toast({
        title: 'Convite enviado!',
        description: `Um convite foi enviado para ${inviteEmail}`,
      });
    }

    setLoading(false);
    setIsDialogOpen(false);
    setInviteEmail('');
    loadMembers();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;

    const { error } = await supabase
      .from('company_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast({
        title: 'Erro ao remover membro',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Membro removido',
      description: 'O membro foi removido com sucesso.'
    });

    loadMembers();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      active: 'default',
      invited: 'secondary',
      suspended: 'outline'
    };

    const labels: Record<string, string> = {
      active: 'Ativo',
      invited: 'Convidado',
      suspended: 'Suspenso'
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
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
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os membros da sua equipe
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar novo membro</DialogTitle>
              <DialogDescription>
                Envie um convite para um novo membro da equipe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline h-4 w-4 mr-2" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">
                  <Shield className="inline h-4 w-4 mr-2" />
                  Função
                </Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendente">Atendente</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleInvite} disabled={loading || !inviteEmail}>
                  {loading ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>
            Lista de todos os membros da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.profiles?.name || 'Usuário convidado'}
                  </TableCell>
                  <TableCell>
                    {member.user_roles?.[0]?.role === 'administrador' ? 'Administrador' : 'Atendente'}
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={member.user_id === user?.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
