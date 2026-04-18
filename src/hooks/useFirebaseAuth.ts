// @ts-nocheck
import { useState, useEffect, createContext, useContext } from 'react';
import { 
  signUp, 
  login, 
  loginWithGoogle, 
  logout, 
  getCurrentUser, 
  onAuthStateChanged 
} from '@/lib/firebase';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within AuthProvider');
  }
  return context;
};

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signUp(email, password);
      if (result.success) {
        // User is automatically set by onAuthStateChanged
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const handleLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await login(email, password);
      if (result.success) {
        // User is automatically set by onAuthStateChanged
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const handleLoginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        // User is automatically set by onAuthStateChanged
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await logout();
      if (result.success) {
        // User is automatically set to null by onAuthStateChanged
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signUp: handleSignUp,
    login: handleLogin,
    loginWithGoogle: handleLoginWithGoogle,
    logout: handleLogout,
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};

export default FirebaseAuthProvider;
