'use client';

import { useSession, useUser, useDescope } from '@descope/nextjs-sdk/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ClientOnly } from '@/components/ClientOnly';
import { usePermissions } from '@/hooks/usePermissions';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

export default function Home() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user, isUserLoading } = useUser();
  const { logout } = useDescope();
  const { } = usePermissions();
  const { } = useMCPConnection();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Initialize token refresh service
  useTokenRefresh();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isSessionLoading) {
      // Immediate auth check without artificial delay
      setAuthCheckComplete(true);
      if (!isAuthenticated) {
        // If user is not authenticated, redirect to sign-in
        router.push('/login');
      }
    }
  }, [isClient, isAuthenticated, isSessionLoading, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Use Descope's built-in logout method
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Show logout loading state
  if (isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-4xl mb-4">🚪</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Signing Out...</h1>
          <p className="text-gray-600">Please wait while we sign you out</p>
        </div>
      </div>
    );
  }

  // Show loading state only for critical authentication checks
  if (!isClient || isSessionLoading || isUserLoading || !authCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h1>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to sign-in
  }

  return (
    <ClientOnly fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h1>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    }>
      <DashboardLayout user={user} onLogout={handleLogout} />
    </ClientOnly>
  );
}