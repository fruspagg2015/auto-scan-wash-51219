import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ApiLoginPayload, ApiUser } from '@/services/authApi';

export type UserRole = 'atendente' | 'administrador';

export interface Company {
  id: string;
  name: string;
  role: UserRole;
  status: 'active' | 'invited' | 'suspended';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  companies: Company[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  switchCompany: (companyId: string) => Promise<void>;
  currentCompanyId: string | null;
  currentCompany: Company | null;
  loginWithApi: (payload: ApiLoginPayload) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapApiUserToUser = (apiUser: ApiUser): User => {
  const role: UserRole = apiUser.perfil === 'admin' ? 'administrador' : 'atendente';
  const companyId = 'default-company';
  const companyName = 'Empresa Padrão';
  
  const company: Company = {
    id: companyId,
    name: companyName,
    role: role,
    status: 'active'
  };

  return {
    id: String(apiUser.idusuario),
    email: apiUser.email,
    name: apiUser.nome,
    role: role,
    companyId: companyId,
    companyName: companyName,
    companies: [company]
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

      const { data: companies, error: companiesError } = await supabase
        .rpc('get_user_companies', { _user_id: userId });

      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
        return null;
      }

      if (!companies || companies.length === 0) {
        console.error('No companies found for user');
        return null;
      }

      // Get stored company ID or use first company
      const storedCompanyId = localStorage.getItem('currentCompanyId');
      const currentCompany = companies.find((c: any) => c.company_id === storedCompanyId) || companies[0];
      
      setCurrentCompanyId(currentCompany.company_id);
      localStorage.setItem('currentCompanyId', currentCompany.company_id);

      return {
        id: userId,
        email: profile?.full_name || '',
        name: profile?.full_name || '',
        role: currentCompany.user_role as UserRole,
        companyId: currentCompany.company_id,
        companyName: currentCompany.company_name,
        companies: companies.map((c: any) => ({
          id: c.company_id,
          name: c.company_name,
          role: c.user_role as UserRole,
          status: c.member_status
        }))
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    // 1. Verificar primeiro a nova API
    const storedToken = localStorage.getItem('auth_token');
    const storedUserJson = localStorage.getItem('auth_user');

    if (storedToken && storedUserJson) {
      try {
        const apiUser: ApiUser = JSON.parse(storedUserJson);
        const mappedUser = mapApiUserToUser(apiUser);
        setUser(mappedUser);
        setCurrentCompanyId(mappedUser.companyId);
        setIsLoading(false);
        return; // Pula a inicialização do Supabase se já estiver autenticado na nova API
      } catch (e) {
        console.error('Erro ao restaurar sessão da nova API:', e);
        // Em caso de erro ao parsear, limpa e tenta o fallback
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_idsessao');
        localStorage.removeItem('auth_user');
      }
    }

    // 2. Fallback para Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          setTimeout(async () => {
            const userData = await fetchUserData(session.user.id);
            setUser(userData);
          }, 0);
        } else {
          // Apenas limpa se não houver sessão ativa da nova API
          if (!localStorage.getItem('auth_token')) {
            setUser(null);
            setCurrentCompanyId(null);
            localStorage.removeItem('currentCompanyId');
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        setTimeout(async () => {
          const userData = await fetchUserData(session.user.id);
          setUser(userData);
          setIsLoading(false);
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithApi = (payload: ApiLoginPayload) => {
    localStorage.setItem('auth_token', payload.token);
    localStorage.setItem('auth_idsessao', String(payload.idsessao));
    localStorage.setItem('auth_user', JSON.stringify(payload.user));

    const mappedUser = mapApiUserToUser(payload.user);
    setUser(mappedUser);
    setCurrentCompanyId(mappedUser.companyId);
  };

  const logout = async () => {
    // Limpa credenciais da nova API
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_idsessao');
    localStorage.removeItem('auth_user');
    
    // Limpa credenciais do Supabase
    await supabase.auth.signOut();
    
    setUser(null);
    setSession(null);
    setCurrentCompanyId(null);
    localStorage.removeItem('currentCompanyId');
  };

  const switchCompany = async (companyId: string) => {
    if (!user) return;
    
    const company = user.companies.find(c => c.id === companyId);
    if (!company) return;

    setCurrentCompanyId(companyId);
    localStorage.setItem('currentCompanyId', companyId);

    setUser({
      ...user,
      companyId: company.id,
      companyName: company.name,
      role: company.role
    });
  };

  const value = {
    user,
    session,
    logout,
    isAuthenticated: !!user,
    isLoading,
    switchCompany,
    currentCompanyId,
    currentCompany: user?.companies.find(c => c.id === currentCompanyId) || null,
    loginWithApi
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}