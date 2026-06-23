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
import { Plus, Search, Edit, Trash2, Car, Clock, Droplets, Loader2 } from "lucide-react"
import { listServicesApi, BackendService } from "@/services/clientApi"
import { useToast } from "@/hooks/use-toast"

const categorias = ["Lavagem", "Proteção", "Estética", "Detalhamento", "Manutenção"]

export default function Servicos() {
  const { toast } = useToast()
  const [servicos, setServicos] = useState<BackendService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingServico, setEditingServico] = useState<BackendService | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    descricao: "",
    tempoestimado: "",
    valor: "",
    itens: ""
  })

  const loadServicos = async () => {
    try {
      setIsLoading(true)
      const data = await listServicesApi()
      setServicos(data)
    } catch (error: any) {
      console.error('Error loading services:', error)
      toast({
        title: "Erro ao carregar serviços",
        description: error.message || "Não foi possível carregar a lista de serviços.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadServicos()
  }, [])

  const filteredServicos = servicos.filter(servico =>
    servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (servico.categoria && servico.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (servico.descricao && servico.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const valorNum = parseFloat(formData.valor) || 0
    const tempoNum = parseInt(formData.tempoestimado) || 0
    
    const itensArray = formData.itens.split(",")
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map((item, index) => ({
        idservicoitem: Date.now() + index,
        descricao: item,
        incluso: true,
        ordem: index + 1
      }))

    if (editingServico) {
      setServicos(prev => prev.map(s => 
        s.idservico === editingServico.idservico 
          ? {
              ...s,
              nome: formData.nome,
              categoria: formData.categoria,
              descricao: formData.descricao,
              tempoestimado: tempoNum,
              valor: valorNum,
              itens: itensArray
            }
          : s
      ))
      toast({
        title: "Serviço atualizado",
        description: "Os dados do serviço foram salvos localmente com sucesso."
      })
    } else {
      const novoServico: BackendService = {
        idservico: Date.now(),
        nome: formData.nome,
        categoria: formData.categoria,
        descricao: formData.descricao,
        tempoestimado: tempoNum,
        valor: valorNum,
        ativo: true,
        itens: itensArray
      }
      setServicos(prev => [novoServico, ...prev])
      toast({
        title: "Serviço cadastrado",
        description: "Serviço adicionado localmente com sucesso."
      })
    }
    
    setIsDialogOpen(false)
    setEditingServico(null)
    setFormData({
      nome: "",
      categoria: "",
      descricao: "",
      tempoestimado: "",
      valor: "",
      itens: ""
    })
  }

  const handleEdit = (servico: BackendService) => {
    setEditingServico(servico)
    setFormData({
      nome: servico.nome,
      categoria: servico.categoria || "",
      descricao: servico.descricao || "",
      tempoestimado: servico.tempoestimado ? servico.tempoestimado.toString() : "",
      valor: servico.valor ? servico.valor.toString() : "",
      itens: servico.itens ? servico.itens.map(i => i.descricao).join(", ") : ""
    })
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingServico(null)
    setFormData({
      nome: "",
      categoria: "",
      descricao: "",
      tempoestimado: "",
      valor: "",
      itens: ""
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      "Lavagem": "bg-blue-500/10 text-blue-700 border-blue-200",
      "Proteção": "bg-green-500/10 text-green-700 border-green-200", 
      "Estética": "bg-purple-500/10 text-purple-700 border-purple-200",
      "Detalhamento": "bg-indigo-500/10 text-indigo-700 border-indigo-200",
      "Manutenção": "bg-orange-500/10 text-orange-700 border-orange-200"
    }
    return colors[categoria] || "bg-gray-500/10 text-gray-700 border-gray-200"
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingServico ? "Editar Serviço" : "Cadastrar Novo Serviço"}
              </DialogTitle>
              <DialogDescription>
                {editingServico 
                  ? "Edite os dados do serviço abaixo."
                  : "Preencha os dados do novo serviço abaixo."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Serviço *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tempoestimado">Duração (minutos) *</Label>
                  <Input
                    id="tempoestimado"
                    type="number"
                    value={formData.tempoestimado}
                    onChange={(e) => setFormData({...formData, tempoestimado: e.target.value})}
                    placeholder="Ex: 30"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valor">Preço (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    placeholder="Ex: 25.00"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="itens">Itens Inclusos</Label>
                <Textarea
                  id="itens"
                  value={formData.itens}
                  onChange={(e) => setFormData({...formData, itens: e.target.value})}
                  placeholder="Ex: Lavagem externa, Aspiração, Limpeza vidros (separados por vírgula)"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingServico ? "Salvar Alterações" : "Cadastrar Serviço"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
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
              placeholder="Buscar serviços por nome, categoria ou descrição..."
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
                <Car className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Serviços</p>
                <p className="text-lg font-semibold">{servicos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Droplets className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ativos</p>
                <p className="text-lg font-semibold">{servicos.filter(s => s.ativo).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
                <p className="text-lg font-semibold">
                  {servicos.length > 0 ? Math.round(servicos.reduce((acc, s) => acc + (s.tempoestimado || 0), 0) / servicos.length) : 0} min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Car className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Preço Médio</p>
                <p className="text-lg font-semibold">
                  {formatPrice(servicos.length > 0 ? servicos.reduce((acc, s) => acc + (s.valor || 0), 0) / servicos.length : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
          <CardDescription>
            Encontrados {filteredServicos.length} serviço(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Carregando serviços...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredServicos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum serviço encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServicos.map((servico) => (
                    <TableRow key={servico.idservico}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{servico.nome}</div>
                          <div className="text-sm text-muted-foreground">{servico.descricao}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(servico.categoria)}>
                          {servico.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {servico.tempoestimado} min
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-green-600 font-mono">
                        {formatPrice(servico.valor)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {servico.itens && servico.itens.slice(0, 2).map((item, index) => (
                            <div key={index} className="text-muted-foreground">• {item.descricao}</div>
                          ))}
                          {servico.itens && servico.itens.length > 2 && (
                            <div className="text-xs text-muted-foreground font-semibold text-primary">
                              +{servico.itens.length - 2} mais
                            </div>
                          )}
                          {(!servico.itens || servico.itens.length === 0) && (
                            <div className="text-xs text-muted-foreground italic">Nenhum item</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={servico.ativo ? "default" : "secondary"}>
                          {servico.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(servico)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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