'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, User } from '@/lib/auth';

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  updateAuthState: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true, // Start with loading true to prevent hydration mismatch
  });
  const [mounted, setMounted] = useState(false);

  // Check for stored user data on mount
  useEffect(() => {
    console.log('🔐 AuthContext: useEffect triggered');
    setMounted(true);
    
    const checkStoredUser = () => {
      console.log('🔍 AuthContext: Checking stored user...');
      try {
        const storedUser = localStorage.getItem('user_data');
        console.log('📦 AuthContext: Raw stored user data:', storedUser);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Validate that we have a session token
          if (userData.sessionToken) {
            console.log('✅ AuthContext: Found valid user data with session token, setting authenticated');
            console.log('👤 AuthContext: User data:', userData);
            setAuthState({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
            });
          } else {
            console.log('❌ AuthContext: User data exists but no session token, removing invalid data');
            localStorage.removeItem('user_data');
            setAuthState({
              isAuthenticated: false,
              user: null,
              isLoading: false,
            });
          }
        } else {
          console.log('❌ AuthContext: No user data found, setting unauthenticated');
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('❌ AuthContext: Error parsing stored user data:', error);
        localStorage.removeItem('user_data');
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
    };

    // Small delay to ensure hydration is complete
    console.log('⏳ AuthContext: Setting timeout for user check...');
    setTimeout(checkStoredUser, 100);
  }, []);

  // Don't render children until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-4xl mb-4">🚀</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const login = () => {
    // Navigation to login will be handled by the login page
    window.location.href = '/login';
  };

  const updateAuthState = (userData: any) => {
    console.log('🔄 AuthContext: Updating auth state with new user data:', userData);
    setAuthState({
      isAuthenticated: true,
      user: userData,
      isLoading: false,
    });
  };

  const logout = async () => {
    try {
      localStorage.removeItem('user_data');
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateAuthState }}>
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
