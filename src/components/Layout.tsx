import { ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { CompanySelector } from "./CompanySelector"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard'
      case '/camera':
        return 'Novo Atendimento'
      case '/clientes':
        return 'Clientes'
      case '/servicos':
        return 'Serviços'
      case '/precos':
        return 'Preços'
      case '/relatorios':
        return 'Relatórios'
      case '/concluir-veiculo':
        return 'Concluir Veículo'
      case '/entregar-veiculo':
        return 'Entregar Veículo'
      case '/vehicle-details':
        return 'Detalhes do Veículo'
      case '/configuracoes-empresa':
        return 'Configurações da Empresa'
      case '/usuarios':
        return 'Gerenciar Usuários'
      case '/atendimento':
        return 'Atendimento'
      case '/':
        return 'Atendimento'
      default:
        return 'CarWash Pro'
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Company Selector */}
          <CompanySelector />
          
          {/* Header */}
          <header className="h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold text-foreground">{getPageTitle(location.pathname)}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
                <span className="text-xs bg-wash-blue/10 text-wash-blue px-2 py-1 rounded">
                  {user?.role === 'administrador' ? 'Admin' : 'Atendente'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}