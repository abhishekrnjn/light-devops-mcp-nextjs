'use client';

import { Descope } from '@descope/nextjs-sdk';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to main page after successful sign-up
    router.push('/');
  };

  const handleError = (error: Error) => {
    console.error('Sign-up error:', error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Join the DevOps platform</p>
        </div>
        
        <Descope
          flowId="sign-up"
          onSuccess={handleSuccess}
          onError={handleError}
          theme="light"
        />
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button 
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
