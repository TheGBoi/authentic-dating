import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apolloClient } from '../services/apollo';
import { LOGIN, REGISTER, ME } from '../services/queries';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  interests: string[];
  profilePhotoUrl?: string;
  verificationStatus: string;
  subscriptionType: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  interests: string[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        
        // Validate token and get user data
        const { data } = await apolloClient.query({
          query: ME,
          context: {
            headers: {
              authorization: `Bearer ${storedToken}`,
            },
          },
        });

        if (data?.me) {
          setUser(data.me);
        } else {
          // Token is invalid
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: LOGIN,
        variables: { input: { email, password } },
      });

      if (data?.login) {
        const newToken = data.login;
        setToken(newToken);
        await AsyncStorage.setItem('auth_token', newToken);

        // Get user data
        const { data: userData } = await apolloClient.query({
          query: ME,
          context: {
            headers: {
              authorization: `Bearer ${newToken}`,
            },
          },
        });

        if (userData?.me) {
          setUser(userData.me);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: REGISTER,
        variables: { input: userData },
      });

      if (data?.register) {
        setUser(data.register);
        // Note: Registration returns user object, need to login separately
        await login(userData.email, userData.password);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
      setToken(null);
      await apolloClient.clearStore();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}