import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Edit, Trash2, DollarSign, Percent, Calendar, Package } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

interface ServicePrice {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  status: string
}

const DAYS_OF_WEEK = [
  { value: 'sunday' as const, label: 'Domingo' },
  { value: 'monday' as const, label: 'Segunda' },
  { value: 'tuesday' as const, label: 'Terça' },
  { value: 'wednesday' as const, label: 'Quarta' },
  { value: 'thursday' as const, label: 'Quinta' },
  { value: 'friday' as const, label: 'Sexta' },
  { value: 'saturday' as const, label: 'Sábado' },
]

type DayOfWeek = typeof DAYS_OF_WEEK[number]['value']

interface Promotion {
  id: string
  name: string
  description: string | null
  price: number
  original_price: number
  valid_from: string
  valid_until: string
  status: string
  days_of_week: DayOfWeek[] | null
}

export default function Precos() {
  const { currentCompany } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("servicos")
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [services, setServices] = useState<ServicePrice[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    precoOriginal: "",
    validadeInicio: "",
    validadeFim: "",
    diasSemana: [] as DayOfWeek[]
  })
  const [serviceFormData, setServiceFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria: ""
  })

  useEffect(() => {
    if (currentCompany) {
      loadPromotions()
      loadServices()
    }
  }, [currentCompany])

  const loadServices = async () => {
    if (!currentCompany) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error loading services:', error)
      toast({
        title: "Erro ao carregar serviços",
        description: "Não foi possível carregar os preços dos serviços",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPromotions = async () => {
    if (!currentCompany) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromotions(data || [])
    } catch (error) {
      console.error('Error loading promotions:', error)
      toast({
        title: "Erro ao carregar promoções",
        description: "Não foi possível carregar as promoções",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCompany) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('promotions')
        .insert({
          company_id: currentCompany.id,
          name: formData.nome,
          description: formData.descricao || null,
          price: parseFloat(formData.preco),
          original_price: parseFloat(formData.precoOriginal),
          valid_from: formData.validadeInicio,
          valid_until: formData.validadeFim,
          days_of_week: formData.diasSemana.length > 0 ? formData.diasSemana : null,
          status: 'active'
        })

      if (error) throw error

      toast({
        title: "Promoção criada",
        description: "A promoção foi criada com sucesso"
      })

      setIsDialogOpen(false)
      setFormData({
        nome: "",
        descricao: "",
        preco: "",
        precoOriginal: "",
        validadeInicio: "",
        validadeFim: "",
        diasSemana: []
      })
      loadPromotions()
    } catch (error) {
      console.error('Error creating promotion:', error)
      toast({
        title: "Erro ao criar promoção",
        description: "Não foi possível criar a promoção",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCompany) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('service_prices')
        .insert({
          company_id: currentCompany.id,
          name: serviceFormData.nome,
          description: serviceFormData.descricao || null,
          price: parseFloat(serviceFormData.preco),
          category: serviceFormData.categoria,
          status: 'active'
        })

      if (error) throw error

      toast({
        title: "Serviço cadastrado",
        description: "O preço do serviço foi cadastrado com sucesso"
      })

      setIsServiceDialogOpen(false)
      setServiceFormData({
        nome: "",
        descricao: "",
        preco: "",
        categoria: ""
      })
      loadServices()
    } catch (error) {
      console.error('Error creating service:', error)
      toast({
        title: "Erro ao cadastrar serviço",
        description: "Não foi possível cadastrar o preço do serviço",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return

    try {
      const { error } = await supabase
        .from('service_prices')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Serviço excluído",
        description: "O preço do serviço foi excluído com sucesso"
      })

      loadServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      toast({
        title: "Erro ao excluir serviço",
        description: "Não foi possível excluir o preço do serviço",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta promoção?')) return

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Promoção excluída",
        description: "A promoção foi excluída com sucesso"
      })

      loadPromotions()
    } catch (error) {
      console.error('Error deleting promotion:', error)
      toast({
        title: "Erro ao excluir promoção",
        description: "Não foi possível excluir a promoção",
        variant: "destructive"
      })
    }
  }

  const toggleDayOfWeek = (day: DayOfWeek) => {
    setFormData(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(day)
        ? prev.diasSemana.filter(d => d !== day)
        : [...prev.diasSemana, day]
    }))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const getDayLabel = (day: DayOfWeek) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || day
  }

  const filteredPromotions = promotions.filter(promo =>
    promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (promo.description && promo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preços e Promoções</h1>
          <p className="text-muted-foreground">Gerencie preços de serviços e promoções especiais</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="servicos">Preços dos Serviços</TabsTrigger>
          <TabsTrigger value="promocoes">Promoções</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="servicos" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Preço de Serviço</DialogTitle>
                  <DialogDescription>
                    Preencha os dados abaixo para cadastrar um preço de serviço.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleServiceSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nome-servico">Nome do Serviço *</Label>
                      <Input
                        id="nome-servico"
                        value={serviceFormData.nome}
                        onChange={(e) => setServiceFormData({...serviceFormData, nome: e.target.value})}
                        placeholder="Ex: Lavagem Completa"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Input
                        id="categoria"
                        value={serviceFormData.categoria}
                        onChange={(e) => setServiceFormData({...serviceFormData, categoria: e.target.value})}
                        placeholder="Ex: Lavagem"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preco-servico">Preço (R$) *</Label>
                      <Input
                        id="preco-servico"
                        type="number"
                        step="0.01"
                        min="0"
                        value={serviceFormData.preco}
                        onChange={(e) => setServiceFormData({...serviceFormData, preco: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descricao-servico">Descrição</Label>
                    <Textarea
                      id="descricao-servico"
                      value={serviceFormData.descricao}
                      onChange={(e) => setServiceFormData({...serviceFormData, descricao: e.target.value})}
                      placeholder="Descreva o serviço"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Salvando..." : "Cadastrar Serviço"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Services Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total de Serviços</p>
                    <p className="text-lg font-semibold">{services.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preço Médio</p>
                    <p className="text-lg font-semibold">
                      {services.length > 0 
                        ? formatPrice(services.reduce((sum, s) => sum + Number(s.price), 0) / services.length)
                        : 'R$ 0,00'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Categorias</p>
                    <p className="text-lg font-semibold">
                      {new Set(services.map(s => s.category)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Services Table */}
          <Card>
            <CardHeader>
              <CardTitle>Serviços Cadastrados</CardTitle>
              <CardDescription>
                Gerencie os preços dos seus serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando serviços...
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum serviço encontrado. Cadastre seu primeiro serviço!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{service.name}</div>
                              {service.description && (
                                <div className="text-sm text-muted-foreground">{service.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{service.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              {formatPrice(Number(service.price))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={service.status === 'active' ? "default" : "secondary"}>
                              {service.status === 'active' ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promocoes" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Promoção
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Promoção</DialogTitle>
                  <DialogDescription>
                    Preencha os dados abaixo para criar uma promoção.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nome">Nome da Promoção *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        placeholder="Ex: Combo Lavagem Completa"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="precoOriginal">Preço Original (R$) *</Label>
                      <Input
                        id="precoOriginal"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precoOriginal}
                        onChange={(e) => setFormData({...formData, precoOriginal: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preco">Preço Promocional (R$) *</Label>
                      <Input
                        id="preco"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.preco}
                        onChange={(e) => setFormData({...formData, preco: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="validadeInicio">Data Início *</Label>
                      <Input
                        id="validadeInicio"
                        type="date"
                        value={formData.validadeInicio}
                        onChange={(e) => setFormData({...formData, validadeInicio: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="validadeFim">Data Fim *</Label>
                      <Input
                        id="validadeFim"
                        type="date"
                        value={formData.validadeFim}
                        onChange={(e) => setFormData({...formData, validadeFim: e.target.value})}
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
                      placeholder="Descreva a promoção"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dias da Semana Recorrentes (opcional - deixe vazio para todos os dias)
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.value}
                            checked={formData.diasSemana.includes(day.value)}
                            onCheckedChange={() => toggleDayOfWeek(day.value)}
                          />
                          <Label
                            htmlFor={day.value}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.diasSemana.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Promoção válida apenas: {formData.diasSemana.map(d => getDayLabel(d)).join(', ')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Salvando..." : "Cadastrar Promoção"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Percent className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Promoções Ativas</p>
                    <p className="text-lg font-semibold">{promotions.filter(p => p.status === 'active').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preço Médio</p>
                    <p className="text-lg font-semibold">
                      {promotions.length > 0 
                        ? formatPrice(promotions.reduce((sum, p) => sum + Number(p.price), 0) / promotions.length)
                        : 'R$ 0,00'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Percent className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Economia Média</p>
                    <p className="text-lg font-semibold">
                      {promotions.length > 0
                        ? Math.round(promotions.reduce((sum, p) => {
                            return sum + ((Number(p.original_price) - Number(p.price)) / Number(p.original_price) * 100)
                          }, 0) / promotions.length) + '%'
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recorrentes</p>
                    <p className="text-lg font-semibold">
                      {promotions.filter(p => p.days_of_week && p.days_of_week.length > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Promotions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Promoções Cadastradas</CardTitle>
              <CardDescription>
                Gerencie promoções especiais e combos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando promoções...
                </div>
              ) : filteredPromotions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma promoção encontrada. Crie sua primeira promoção!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Promoção</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Dias da Semana</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Economia</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPromotions.map((promocao) => (
                        <TableRow key={promocao.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{promocao.name}</div>
                              {promocao.description && (
                                <div className="text-sm text-muted-foreground">{promocao.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(promocao.valid_from)}</div>
                              <div className="text-muted-foreground">até {formatDate(promocao.valid_until)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {promocao.days_of_week && promocao.days_of_week.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {promocao.days_of_week.map((day) => (
                                  <Badge key={day} variant="outline" className="text-xs">
                                    {getDayLabel(day)}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Todos os dias</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-green-600">
                                {formatPrice(Number(promocao.price))}
                              </div>
                              <div className="text-sm text-muted-foreground line-through">
                                {formatPrice(Number(promocao.original_price))}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                              -{Math.round(((Number(promocao.original_price) - Number(promocao.price)) / Number(promocao.original_price)) * 100)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={promocao.status === 'active' ? "default" : "secondary"}>
                              {promocao.status === 'active' ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(promocao.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
