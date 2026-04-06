// @ts-nocheck
import { useState, useEffect, useContext, createContext } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  role: 'reseller';
  status: 'active' | 'inactive';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const ResellerAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useResellerDashboardAuth = () => {
  const context = useContext(ResellerAuthContext);
  if (!context) {
    throw new Error('useResellerDashboardAuth must be used within ResellerAuthProvider');
  }
  return context;
};

interface ResellerAuthProviderProps {
  children: React.ReactNode;
}

export const ResellerAuthProvider: React.FC<ResellerAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Demo user data
  const demoUser: User = {
    id: 'reseller-001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    company: 'Doe Enterprises',
    address: '123 Business Street',
    city: 'New York',
    country: 'United States',
    website: 'https://doeenterprises.com',
    role: 'reseller',
    status: 'active'
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('reseller_token');
        if (token) {
          // In a real app, validate token with backend
          // For demo, we'll just set the user
          setUser(demoUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('reseller_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo validation
      if (email === 'reseller@example.com' && password === 'password') {
        const token = 'demo-reseller-token-' + Date.now();
        localStorage.setItem('reseller_token', token);
        setUser(demoUser);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('reseller_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local user data
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      
      // In a real app, this would update the backend
      console.log('Profile updated:', updatedUser);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call to refresh user data
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // In a real app, fetch fresh user data from backend
      // For demo, we'll keep the same user
      setUser(demoUser);
    } catch (error) {
      console.error('User refresh failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile,
    refreshUser
  };

  return (
    <ResellerAuthContext.Provider value={value}>
      {children}
    </ResellerAuthContext.Provider>
  );
};

export default ResellerAuthProvider;
