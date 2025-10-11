import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"

interface Client {
  id: string
  company_id: string
  nome: string
  tipo: string
  telefone: string
  email?: string
  endereco?: string
  cidade?: string
  observacoes?: string
  status: string
  created_at: string
  updated_at: string
}

const clientSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  telefone: z.string().trim().min(1, "Telefone é obrigatório").max(20, "Telefone deve ter no máximo 20 caracteres"),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres").optional().or(z.literal("")),
  endereco: z.string().trim().max(255, "Endereço deve ter no máximo 255 caracteres").optional(),
  cidade: z.string().trim().max(100, "Cidade deve ter no máximo 100 caracteres").optional(),
  tipo: z.enum(["Pessoa Física", "Pessoa Jurídica"]),
  observacoes: z.string().trim().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
})

export default function Clientes() {
  const { currentCompanyId } = useAuth()
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    tipo: "Pessoa Física",
    observacoes: ""
  })

  const loadClients = async () => {
    if (!currentCompanyId) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error: any) {
      console.error('Error loading clients:', error)
      toast({
        title: "Erro ao carregar clientes",
        description: error.message || "Não foi possível carregar a lista de clientes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [currentCompanyId])

  const filteredClientes = clients.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    cliente.telefone.includes(searchTerm)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentCompanyId) {
      toast({
        title: "Erro",
        description: "Empresa não identificada",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Validar dados do formulário
      const validatedData = clientSchema.parse(formData)

      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            ...validatedData,
            email: validatedData.email || null,
            endereco: validatedData.endereco || null,
            cidade: validatedData.cidade || null,
            observacoes: validatedData.observacoes || null,
          })
          .eq('id', editingClient.id)
          .eq('company_id', currentCompanyId)

        if (error) throw error

        toast({
          title: "Cliente atualizado",
          description: "Os dados do cliente foram atualizados com sucesso"
        })
      } else {
        // Insert new client
        const { error } = await supabase
          .from('clients')
          .insert({
            company_id: currentCompanyId,
            ...validatedData,
            email: validatedData.email || null,
            endereco: validatedData.endereco || null,
            cidade: validatedData.cidade || null,
            observacoes: validatedData.observacoes || null,
            status: 'Ativo'
          })

        if (error) throw error

        toast({
          title: "Cliente cadastrado",
          description: "Cliente adicionado com sucesso"
        })
      }

      setIsDialogOpen(false)
      setEditingClient(null)
      setFormData({
        nome: "",
        telefone: "",
        email: "",
        endereco: "",
        cidade: "",
        tipo: "Pessoa Física",
        observacoes: ""
      })
      loadClients()
    } catch (error: any) {
      console.error('Error saving client:', error)
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.issues[0]?.message || "Dados inválidos",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Erro ao salvar cliente",
          description: error.message || "Não foi possível salvar o cliente",
          variant: "destructive"
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (cliente: Client) => {
    setEditingClient(cliente)
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || "",
      endereco: cliente.endereco || "",
      cidade: cliente.cidade || "",
      tipo: cliente.tipo,
      observacoes: cliente.observacoes || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
      return
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('company_id', currentCompanyId)

      if (error) throw error

      toast({
        title: "Cliente excluído",
        description: "Cliente removido com sucesso"
      })
      loadClients()
    } catch (error: any) {
      console.error('Error deleting client:', error)
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Não foi possível excluir o cliente",
        variant: "destructive"
      })
    }
  }

  const handleNewClient = () => {
    setEditingClient(null)
    setFormData({
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      cidade: "",
      tipo: "Pessoa Física",
      observacoes: ""
    })
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleNewClient}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar Cliente" : "Cadastrar Novo Cliente"}</DialogTitle>
              <DialogDescription>
                {editingClient ? "Edite os dados do cliente abaixo." : "Preencha os dados do novo cliente abaixo."}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome/Razão Social *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                      <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingClient ? "Atualizar Cliente" : "Cadastrar Cliente"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes por nome, e-mail ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Clientes</p>
                <p className="text-lg font-semibold">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Mail className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ativos</p>
                <p className="text-lg font-semibold">{clients.filter(c => c.status === "Ativo").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pessoa Física</p>
                <p className="text-lg font-semibold">{clients.filter(c => c.tipo === "Pessoa Física").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <MapPin className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pessoa Jurídica</p>
                <p className="text-lg font-semibold">{clients.filter(c => c.tipo === "Pessoa Jurídica").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Encontrados {filteredClientes.length} cliente(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>
                        <Badge variant={cliente.tipo === "Pessoa Física" ? "secondary" : "outline"}>
                          {cliente.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{cliente.telefone}</div>
                          {cliente.email && <div className="text-muted-foreground">{cliente.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{cliente.cidade || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={cliente.status === "Ativo" ? "default" : "secondary"}>
                          {cliente.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(cliente)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(cliente.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}