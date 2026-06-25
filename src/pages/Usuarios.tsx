import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Shield, Trash2, Phone, Pencil } from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';
import { listUsersApi, BackendUser, saveUserApi } from '@/services/clientApi';

export default function Usuarios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('atendente');

  const [editingMember, setEditingMember] = useState<BackendUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('atendente');
  const [editStatus, setEditStatus] = useState<boolean>(true);
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await listUsersApi();
      setMembers(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message || 'Erro ao carregar lista de usuários da API.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    setLoading(true);
    // Ação fictícia/placeholder mantida
    toast({
      title: 'Convite enviado!',
      description: `Um convite foi enviado para ${inviteEmail} (Simulado)`,
    });

    setLoading(false);
    setIsDialogOpen(false);
    setInviteEmail('');
    loadMembers();
  };

  const handleStartEdit = (member: BackendUser) => {
    setEditingMember(member);
    setEditNome(member.nomeusuario || '');
    setEditTelefone(member.telefone || '');
    const mappedRole: UserRole = member.nomeperfil === 'admin' || member.nomeperfil === 'administrador' ? 'administrador' : 'atendente';
    setEditRole(mappedRole);
    setEditStatus(member.status);
    setEditEmail(member.email || '');
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingMember) return;
    setLoading(true);
    try {
      const idperfil = editRole === 'administrador' ? 1 : 2;
      
      await saveUserApi({
        idusuario: editingMember.idusuario,
        nomeusuario: editNome,
        email: editEmail,
        telefone: editTelefone,
        status: editStatus,
        idperfil: idperfil
      });

      toast({
        title: 'Usuário atualizado',
        description: 'Os dados do usuário foram atualizados com sucesso.',
      });

      setIsEditDialogOpen(false);
      setEditingMember(null);
      loadMembers();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar usuário',
        description: error.message || 'Ocorreu um erro ao salvar as alterações.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    // Exclusão desabilitada por falta de endpoint na API
    toast({
      title: 'Ação não permitida',
      description: 'A remoção de usuários deve ser feita através do painel de administração.',
      variant: 'destructive'
    });
  };

  const getStatusBadge = (status: boolean) => {
    return <Badge variant={status ? 'default' : 'secondary'}>{status ? 'Ativo' : 'Inativo'}</Badge>;
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
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.idusuario}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{member.nomeusuario || 'Sem Nome'}</span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.nomeperfil ? (member.nomeperfil.charAt(0).toUpperCase() + member.nomeperfil.slice(1)) : 'Atendente'}
                  </TableCell>
                  <TableCell>
                    {member.telefone || '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-right flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(member)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.idusuario)}
                      disabled={member.email === user?.email}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize os dados de {editEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail (Não editável)</Label>
              <Input
                id="edit-email"
                value={editEmail}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-telefone">
                <Phone className="inline h-4 w-4 mr-2" />
                Telefone
              </Label>
              <Input
                id="edit-telefone"
                value={editTelefone}
                onChange={(e) => setEditTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">
                <Shield className="inline h-4 w-4 mr-2" />
                Função
              </Label>
              <Select value={editRole} onValueChange={(value) => setEditRole(value as UserRole)}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="atendente">Atendente</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editStatus ? 'ativo' : 'inativo'} onValueChange={(value) => setEditStatus(value === 'ativo')}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleEditSave} disabled={loading || !editNome}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
