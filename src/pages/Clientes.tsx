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
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import { listClientsApi, saveClientApi, deleteClientApi, ClientSavePayload } from "@/services/clientApi"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  documento?: string
  numero?: string
  idcidade?: number
  idbairro?: number
}

const clientSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  telefone: z.string().trim().min(1, "Telefone é obrigatório").max(20, "Telefone deve ter no máximo 20 caracteres"),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres").optional().or(z.literal("")),
  endereco: z.string().trim().max(255, "Endereço deve ter no máximo 255 caracteres").optional(),
  numero: z.string().trim().max(50, "Número deve ter no máximo 50 caracteres").optional(),
  documento: z.string().trim().max(50, "Documento deve ter no máximo 50 caracteres").optional().or(z.literal("")),
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
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    numero: "",
    documento: "",
    cidade: "",
    tipo: "Pessoa Física",
    observacoes: ""
  })

  const loadClients = async () => {
    try {
      const data = await listClientsApi()
      
      const mappedClients: Client[] = data.map((c: any) => ({
        id: String(c.idcliente || c.id || ''),
        company_id: 'default-company',
        nome: c.nome,
        tipo: 'Pessoa Física', // Padrão
        telefone: c.telefoneformatado || c.telefone,
        email: c.email || '',
        endereco: c.logradouro || c.endereco || '',
        cidade: c.cidade || '',
        observacoes: c.observacoes || '',
        status: c.status === false ? 'Inativo' : 'Ativo',
        created_at: c.datainclusaoformatada || '',
        updated_at: c.datainclusaoformatada || '',
        documento: c.documento || '',
        numero: c.numero || '',
        idcidade: c.idcidade || 1,
        idbairro: c.idbairro || 1
      }))

      setClients(mappedClients)
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

  const filteredClientes = clients.filter(cliente => {
    const term = searchTerm.toLowerCase()
    const cleanTerm = searchTerm.replace(/\D/g, '')
    const cleanPhone = cliente.telefone.replace(/\D/g, '')
    return cliente.nome.toLowerCase().includes(term) ||
      (cliente.email && cliente.email.toLowerCase().includes(term)) ||
      cliente.telefone.includes(searchTerm) ||
      (cleanTerm && cleanPhone.includes(cleanTerm))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)

    try {
      // Validar dados do formulário
      const validatedData = clientSchema.parse(formData)

      // Extrai apenas números do telefone
      const rawPhone = formData.telefone.replace(/\D/g, '')

      const clientPayload: ClientSavePayload = {
        nome: validatedData.nome,
        email: validatedData.email || '',
        documento: validatedData.documento || '',
        logradouro: validatedData.endereco || '',
        numero: validatedData.numero || '',
        idcidade: 1, // Padrão do curl
        idbairro: 1, // Padrão do curl
        telefone: rawPhone,
        status: true
      }

      if (editingClient) {
        // Atualização de cliente existente (precisa de idcliente)
        clientPayload.idcliente = Number(editingClient.id)
        await saveClientApi(clientPayload)

        toast({
          title: "Cliente atualizado",
          description: "Os dados do cliente foram atualizados com sucesso"
        })
      } else {
        // Cadastro de novo cliente (NÃO pode ter idcliente)
        await saveClientApi(clientPayload)

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
        numero: "",
        documento: "",
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
      numero: cliente.numero || "",
      documento: cliente.documento || "",
      cidade: cliente.cidade || "",
      tipo: cliente.tipo,
      observacoes: cliente.observacoes || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (cliente: Client) => {
    setClientToDelete(cliente)
  }

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return

    setIsDeleting(true)
    try {
      await deleteClientApi(Number(clientToDelete.id))

      toast({
        title: "Cliente excluído",
        description: "Cliente removido com sucesso"
      })
      setClientToDelete(null)
      loadClients()
    } catch (error: any) {
      console.error('Error deleting client:', error)
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Não foi possível excluir o cliente",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, ddd, first, second) => {
        if (second) return `(${ddd}) ${first}-${second}`
        if (first) return `(${ddd}) ${first}`
        if (ddd) return `(${ddd}`
        return numbers
      })
    }
    
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, ddd, first, second) => {
      if (second) return `(${ddd}) ${first}-${second}`
      if (first) return `(${ddd}) ${first}`
      return numbers
    })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData({...formData, telefone: formatted})
  }

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 14)
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    } else {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value)
    setFormData({...formData, documento: formatted})
  }

  const handleNewClient = () => {
    setEditingClient(null)
    setFormData({
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      numero: "",
      documento: "",
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
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="documento">CPF/CNPJ</Label>
                  <Input
                    id="documento"
                    value={formData.documento}
                    onChange={handleDocumentChange}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    maxLength={18}
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
                  <Label htmlFor="endereco">Endereço (Logradouro)</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    placeholder="123 ou S/N"
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
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(cliente)}>
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
      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.nome}</strong>? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}