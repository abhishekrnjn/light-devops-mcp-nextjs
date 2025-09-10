'use client';

import { Descope } from '@descope/nextjs-sdk';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to main page after successful authentication
    router.push('/');
  };

  const handleError = (error: Error) => {
    console.error('Authentication error:', error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">👋</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome</h1>
          <p className="text-gray-600">Sign in to your account or create a new one</p>
        </div>
        
        <Descope
          flowId="sign-up-or-in"
          onSuccess={handleSuccess}
          onError={handleError}
          theme="light"
        />
      </div>
    </div>
  );
}