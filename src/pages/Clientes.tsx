import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react"

// Mock data
const mockClientes = [
  {
    id: 1,
    nome: "João Silva",
    telefone: "(11) 99999-9999",
    email: "joao.silva@email.com",
    endereco: "Rua das Flores, 123",
    cidade: "São Paulo",
    tipo: "Pessoa Física",
    ultimaVisita: "2024-01-15",
    totalGasto: "R$ 450,00",
    status: "Ativo"
  },
  {
    id: 2,
    nome: "Empresa ABC Ltda",
    telefone: "(11) 88888-8888",
    email: "contato@empresaabc.com",
    endereco: "Av. Paulista, 1000",
    cidade: "São Paulo", 
    tipo: "Pessoa Jurídica",
    ultimaVisita: "2024-01-20",
    totalGasto: "R$ 1.200,00",
    status: "Ativo"
  }
]

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    tipo: "Pessoa Física",
    observacoes: ""
  })

  const filteredClientes = mockClientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingClient) {
      console.log("Cliente editado:", { ...formData, id: editingClient.id })
    } else {
      console.log("Cliente cadastrado:", formData)
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
  }

  const handleEdit = (cliente: any) => {
    setEditingClient(cliente)
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      endereco: cliente.endereco,
      cidade: cliente.cidade,
      tipo: cliente.tipo,
      observacoes: cliente.observacoes || ""
    })
    setIsDialogOpen(true)
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
                <Button type="submit" className="flex-1">
                  {editingClient ? "Atualizar Cliente" : "Cadastrar Cliente"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
                <p className="text-lg font-semibold">{mockClientes.length}</p>
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
                <p className="text-lg font-semibold">{mockClientes.filter(c => c.status === "Ativo").length}</p>
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
                <p className="text-lg font-semibold">{mockClientes.filter(c => c.tipo === "Pessoa Física").length}</p>
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
                <p className="text-lg font-semibold">{mockClientes.filter(c => c.tipo === "Pessoa Jurídica").length}</p>
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
                  <TableHead>Última Visita</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
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
                        <div className="text-muted-foreground">{cliente.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{cliente.cidade}</TableCell>
                    <TableCell>{cliente.ultimaVisita}</TableCell>
                    <TableCell className="font-medium text-green-600">{cliente.totalGasto}</TableCell>
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
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}