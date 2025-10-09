import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', userId)
        .single();

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
        email: profile?.name || '',
        name: profile?.name || '',
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
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          setTimeout(async () => {
            const userData = await fetchUserData(session.user.id);
            setUser(userData);
          }, 0);
        } else {
          setUser(null);
          setCurrentCompanyId(null);
          localStorage.removeItem('currentCompanyId');
        }
      }
    );

    // Then check for existing session
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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCurrentCompanyId(null);
    localStorage.removeItem('currentCompanyId');
  };

  const switchCompany = async (companyId: string) => {
    if (!user || !session) return;
    
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
    isAuthenticated: !!session,
    isLoading,
    switchCompany,
    currentCompanyId,
    currentCompany: user?.companies.find(c => c.id === currentCompanyId) || null
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