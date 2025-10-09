// Authentication data and types

export type UserRole = 'atendente' | 'administrador';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Mock users for authentication
export const mockUsers: Record<string, { password: string; user: User }> = {
  'atendente@carwash.com': {
    password: 'senha123',
    user: {
      id: '1',
      email: 'atendente@carwash.com',
      name: 'João Atendente',
      role: 'atendente'
    }
  },
  'admin@carwash.com': {
    password: 'admin123',
    user: {
      id: '2',
      email: 'admin@carwash.com',
      name: 'Maria Administradora',
      role: 'administrador'
    }
  }
};

// Authentication functions
export const authenticateUser = async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const userData = mockUsers[email];
  
  if (!userData) {
    return { user: null, error: 'Email não encontrado' };
  }
  
  if (userData.password !== password) {
    return { user: null, error: 'Senha incorreta' };
  }
  
  return { user: userData.user, error: null };
};