'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('ic_crm_token');
    const storedUser = localStorage.getItem('ic_crm_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('ic_crm_token');
        localStorage.removeItem('ic_crm_user');
      }
    } else {
      // Default demo session for immediate CRM use
      const demoUser: User = {
        id: 'usr_admin_demo',
        email: 'admin@iccrm.io',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      };
      const demoToken = 'mock_jwt_token_admin_demo';
      setUser(demoUser);
      setToken(demoToken);
      localStorage.setItem('ic_crm_user', JSON.stringify(demoUser));
      localStorage.setItem('ic_crm_token', demoToken);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/v1/auth/register?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      setUser(data.data.user);
      setToken(data.data.token);
      localStorage.setItem('ic_crm_user', JSON.stringify(data.data.user));
      localStorage.setItem('ic_crm_token', data.data.token);

      return { success: true };
    } catch {
      return { success: false, error: 'Network error during login' };
    }
  };

  const register = async (formData: { email: string; password: string; firstName: string; lastName: string }) => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      setUser(data.data.user);
      setToken(data.data.token);
      localStorage.setItem('ic_crm_user', JSON.stringify(data.data.user));
      localStorage.setItem('ic_crm_token', data.data.token);

      return { success: true };
    } catch {
      return { success: false, error: 'Network error during registration' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ic_crm_token');
    localStorage.removeItem('ic_crm_user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('ic_crm_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
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
