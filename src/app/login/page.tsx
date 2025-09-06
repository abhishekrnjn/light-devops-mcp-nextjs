'use client';

import { Descope } from '@descope/nextjs-sdk';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to main page after successful login
    router.push('/');
  };

  const handleError = (error: Error) => {
    console.error('Login error:', error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">👋</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        
        <Descope
          flowId="sign-up-or-in"
          onSuccess={handleSuccess}
          onError={handleError}
          theme="light"
        />
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <button 
              onClick={() => router.push('/signup')}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}