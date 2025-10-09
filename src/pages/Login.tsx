import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido').trim(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').trim()
});

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const redirectPath = user.role === 'administrador' ? '/dashboard' : '/atendimento';
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (authError) setAuthError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError('');

    // Client-side validation
    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(error => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // Map Supabase errors to Portuguese
        if (error.message.includes('Invalid login credentials')) {
          setAuthError('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          setAuthError('Email não confirmado. Verifique seu email.');
        } else {
          setAuthError(error.message);
        }
        return;
      }

      if (data.user) {
        // Fetch user role to determine redirect
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', data.user.id)
          .single();

        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${profile?.name || data.user.email}!`,
        });

        // Redirect based on user role
        if (roleData?.role === 'administrador') {
          navigate('/dashboard');
        } else {
          navigate('/atendimento');
        }
      }
    } catch (error) {
      setAuthError('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wash-blue/10 to-wash-blue/5 p-4">
      <Card className="w-full max-w-md shadow-wash">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-wash-blue">CarWash Pro</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {authError && (
              <Alert variant="destructive">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seu@email.com"
                className={errors.email ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
                className={errors.password ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              variant="wash"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Credenciais de teste:</p>
              <div className="space-y-1 text-xs">
                <p><strong>Atendente:</strong> atendente@carwash.com / senha123</p>
                <p><strong>Admin:</strong> admin@carwash.com / admin123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}