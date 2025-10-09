import { useState, useEffect } from "react"
import { 
  Home, 
  Camera, 
  Users, 
  Wrench, 
  DollarSign, 
  BarChart3,
  Settings,
  ChevronDown,
  Building2,
  Zap,
  FileText,
  CheckCircle,
  ClipboardCheck,
  Droplets,
  Sparkles,
  LogOut
} from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const getMenuItems = (userRole: string) => {
  const mainItems = [
    { title: "Atendimento", url: "/atendimento", icon: Home, description: "Tela principal de atendimento" },
    { title: "Novo Atendimento", url: "/camera", icon: Camera, description: "Iniciar novo atendimento" },
  ];

  const adminMainItems = [
    { title: "Dashboard", url: "/dashboard", icon: BarChart3, description: "Visão geral do sistema" },
    { title: "Novo Atendimento", url: "/camera", icon: Camera, description: "Iniciar novo atendimento" },
  ];

  const cadastroItems = [
    { title: "Clientes", url: "/clientes", icon: Users, description: "Gerenciar clientes" },
    { title: "Serviços", url: "/servicos", icon: Wrench, description: "Configurar serviços" },
    { title: "Preços", url: "/precos", icon: DollarSign, description: "Definir preços" },
  ];

  const configItems = [
    { title: "Empresa", url: "/configuracoes-empresa", icon: Building2, description: "Configurações da empresa" },
    { title: "Usuários", url: "/usuarios", icon: Users, description: "Gerenciar usuários" },
  ];

  const otherItems = [
    { title: "Relatórios", url: "/relatorios", icon: BarChart3, description: "Visualizar relatórios" },
  ];

  const quickActions = [
    { title: "Concluir Veículo", url: "/concluir-veiculo", icon: ClipboardCheck, description: "Finalizar veículos em andamento" },
    { title: "Entregar Veículo", url: "/entregar-veiculo", icon: CheckCircle, description: "Finalizar e entregar veículo" },
  ];

  return {
    main: userRole === 'administrador' ? adminMainItems : mainItems,
    cadastro: userRole === 'administrador' ? cadastroItems : [],
    config: userRole === 'administrador' ? configItems : [],
    other: userRole === 'administrador' ? otherItems : [],
    quickActions: userRole === 'administrador' ? quickActions : []
  };
};

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"
  
  const menuItems = getMenuItems(user?.role || 'atendente')

  // Auto-close sidebar on mobile after navigation
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [currentPath, isMobile, setOpenMobile])

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/15 text-primary font-semibold border-r-3 border-primary shadow-sm" 
      : "hover:bg-muted/70 hover:text-foreground transition-all duration-200 ease-smooth"

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const MenuItemWithTooltip = ({ item, children }: { item: any, children: React.ReactNode }) => {
    if (!collapsed) return <>{children}</>
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="animate-fade-in">
          <div className="text-sm font-medium">{item.title}</div>
          <div className="text-xs text-muted-foreground">{item.description}</div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Sidebar 
      className={`transition-sidebar duration-300 ease-smooth ${collapsed ? "w-16" : "w-64"}`} 
      collapsible="icon"
    >
        <SidebarContent className="overflow-hidden">
          {/* Header */}
          <SidebarGroup className="px-0">
            <div className={`flex items-center gap-3 px-4 py-6 transition-all duration-300 ${collapsed ? 'justify-center px-2' : ''}`}>
              <div className="relative">
                <Droplets className={`text-wash-blue transition-all duration-300 ${collapsed ? 'h-6 w-6' : 'h-8 w-8'}`} />
                {collapsed && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse-soft opacity-60" />
                )}
              </div>
              {!collapsed && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-wash-blue">
                      CarWash Pro
                    </h2>
                    <Sparkles className="h-5 w-5 text-wash-green" />
                  </div>
                  <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
                </div>
              )}
            </div>
          </SidebarGroup>

          <SidebarSeparator className="mx-4" />

          {/* Quick Actions (when expanded) */}
          {!collapsed && menuItems.quickActions.length > 0 && (
            <SidebarGroup className="animate-fade-in">
              <SidebarGroupLabel className="text-accent font-medium">Acesso Rápido</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.quickActions.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="bg-accent/10 hover:bg-accent/20 border border-accent/20">
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-medium">Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.main.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <MenuItemWithTooltip item={item}>
                      <SidebarMenuButton asChild className="group transition-all duration-200">
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                          {!collapsed && <span className="transition-all duration-200">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </MenuItemWithTooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="mx-4" />

          {/* Cadastros Navigation - Only for admins */}
          {menuItems.cadastro.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-primary font-medium">Cadastros</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.cadastro.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <MenuItemWithTooltip item={item}>
                        <SidebarMenuButton asChild className="group transition-all duration-200">
                          <NavLink to={item.url} className={getNavCls}>
                            <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                            {!collapsed && <span className="transition-all duration-200">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </MenuItemWithTooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarSeparator className="mx-4" />

          {/* Config Navigation - Only for admins */}
          {menuItems.config.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-primary font-medium">Configurações</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.config.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <MenuItemWithTooltip item={item}>
                        <SidebarMenuButton asChild className="group transition-all duration-200">
                          <NavLink to={item.url} className={getNavCls}>
                            <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                            {!collapsed && <span className="transition-all duration-200">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </MenuItemWithTooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarSeparator className="mx-4" />

          {/* Other Navigation - Only for admins */}
          {menuItems.other.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-primary font-medium">Análises</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.other.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <MenuItemWithTooltip item={item}>
                        <SidebarMenuButton asChild className="group transition-all duration-200">
                          <NavLink to={item.url} className={getNavCls}>
                            <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                            {!collapsed && <span className="transition-all duration-200">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </MenuItemWithTooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Bottom spacer */}
          <div className="flex-1" />
          
          {/* Logout Section */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <MenuItemWithTooltip item={{ title: "Sair do Sistema", description: "Finalizar sessão" }}>
                    <SidebarMenuButton 
                      onClick={handleLogout}
                      className="group transition-all duration-200 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
                      {!collapsed && <span className="transition-all duration-200">Sair do Sistema</span>}
                    </SidebarMenuButton>
                  </MenuItemWithTooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Footer info when collapsed */}
          {collapsed && (
            <div className="p-2 flex justify-center">
              <div className="w-8 h-1 bg-primary/30 rounded-full" />
            </div>
          )}
        </SidebarContent>
      </Sidebar>
    )
  }
