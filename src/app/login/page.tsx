'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DescopeAuth from '@/components/DescopeAuth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, updateAuthState } = useAuth();

  useEffect(() => {
    console.log('🔐 LoginPage: useEffect triggered');
    console.log('🔐 LoginPage: isAuthenticated =', isAuthenticated);
    console.log('🔐 LoginPage: isLoading =', isLoading);
    
    if (isAuthenticated) {
      console.log('✅ LoginPage: User is authenticated, redirecting to dashboard...');
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">DevOps MCP Dashboard</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>
        
        <DescopeAuth
          projectId={process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID || ''}
          flowId="sign-up-or-in"
          onSuccess={(userData) => {
            console.log('🎉 Login success callback triggered with userData:', userData);
            updateAuthState(userData);
            console.log('🚀 Redirecting to dashboard...');
            router.push('/dashboard');
          }}
        />
      </div>
    </div>
  );
}