import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import type { User } from '@shared/schema';

interface AuthContext {
  user: User | null;
  credits: number;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [tokens, setTokens] = useState(() => {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    };
  });

  // Set authorization header for all requests
  useEffect(() => {
    if (tokens.accessToken) {
      // This will be used by the default query function
      localStorage.setItem('accessToken', tokens.accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, [tokens.accessToken]);

  const { data: authData, isLoading } = useQuery<{ user: User; credits: number }>({
    queryKey: ['/api/me'],
    enabled: !!tokens.accessToken,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiRequest('POST', '/api/auth/login', { email, password });
      return res.json();
    },
    onSuccess: (data) => {
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setLocation('/');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; phone?: string }) => {
      const res = await apiRequest('POST', '/api/auth/register', data);
      return res.json();
    },
    onSuccess: (data) => {
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setLocation('/');
    },
  });

  const logout = () => {
    setTokens({ accessToken: null, refreshToken: null });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    queryClient.clear();
    setLocation('/login');
  };

  const isAuthenticated = !!tokens.accessToken && !!authData?.user;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const contextValue: AuthContext = {
    user: authData?.user || null,
    credits: authData?.credits || 0,
    isLoading,
    login: async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    register: async (name: string, email: string, password: string, phone?: string) => {
      await registerMutation.mutateAsync({ name, email, password, phone });
    },
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
