import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, setClientToken, getClientToken } from '../api/client.js';
import type { User, UserRole } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  quickLoginAsRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; title: string }> = {
  SUPER_ADMIN: {
    email: 'superadmin@robolab.edu',
    pass: 'Admin@12345!',
    title: 'Dr. Evelyn Vance (Director)',
  },
  LAB_ADMIN: {
    email: 'labadmin@robolab.edu',
    pass: 'Admin@12345!',
    title: 'Marcus Sterling (Lab Admin)',
  },
  FACULTY: {
    email: 'prof.sharma@robolab.edu',
    pass: 'Faculty@12345!',
    title: 'Prof. Anita Sharma (Faculty)',
  },
  LAB_TECHNICIAN: {
    email: 'tech.alex@robolab.edu',
    pass: 'Tech@12345!',
    title: 'Alexander Hayes (Technician)',
  },
  STUDENT: {
    email: 'student.maya@robolab.edu',
    pass: 'Student@12345!',
    title: 'Maya Lin (Student Senior)',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.success && res.data.data?.user) {
        setUser(res.data.data.user);
      }
    } catch {
      setUser(null);
      setClientToken(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getClientToken();
      if (token) {
        try {
          await refreshUser();
        } catch {
          // Token expired or invalid
        }
      } else {
        // Try refresh via http-only cookie
        try {
          const res = await apiClient.post('/auth/refresh', {});
          if (res.data?.success && res.data.data?.accessToken) {
            setClientToken(res.data.data.accessToken);
            setUser(res.data.data.user);
          }
        } catch {
          // No active session cookie
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.success) {
      setClientToken(res.data.data.accessToken);
      setUser(res.data.data.user);
    }
  };

  const register = async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    if (res.data.success) {
      setClientToken(res.data.data.accessToken);
      setUser(res.data.data.user);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network failures on logout
    } finally {
      setClientToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await apiClient.patch('/users/profile', data);
    if (res.data.success && res.data.data) {
      setUser(res.data.data);
    }
  };

  const quickLoginAsRole = async (targetRole: UserRole) => {
    const cred = DEMO_CREDENTIALS[targetRole];
    if (cred) {
      setLoading(true);
      try {
        await login(cred.email, cred.pass);
      } finally {
        setLoading(false);
      }
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        loading,
        login,
        register,
        logout,
        updateProfile,
        quickLoginAsRole,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
