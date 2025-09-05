'use client';

import { useSession, useDescope, useUser } from '@descope/nextjs-sdk/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user, isUserLoading } = useUser();
  const { logout } = useDescope();
  const router = useRouter();

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      // If user is not authenticated, redirect to sign-up
      router.push('/signup');
    }
  }, [isAuthenticated, isSessionLoading, router]);

  if (isSessionLoading || isUserLoading) {
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
    return null; // Will redirect to sign-up
  }

  const handleLogout = async () => {
    await logout();
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome!</h1>
            <p className="text-gray-600">You&apos;re successfully authenticated</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">User Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Status:</span> Authenticated ✅</p>
              <p><span className="font-medium">Email:</span> {user?.email || 'Not available'}</p>
              <p><span className="font-medium">Name:</span> {user?.name || 'Not provided'}</p>
              <p><span className="font-medium">User ID:</span> {user?.userId || 'Not available'}</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}