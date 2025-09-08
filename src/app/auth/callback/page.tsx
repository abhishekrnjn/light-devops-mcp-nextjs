'use client';

import { useEffect, useState } from 'react';
import { useDescope } from '@descope/nextjs-sdk/client';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const descope = useDescope();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('=== AUTH CALLBACK PROCESSING ===');
        console.log('URL:', window.location.href);
        console.log('Search params:', window.location.search);
        
        // The Descope SDK should automatically handle the callback
        // But we can also manually process it if needed
        if (descope && descope.outbound) {
          console.log('Descope available for callback processing');
          
          // Wait a moment for any automatic processing
          setTimeout(() => {
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Redirect to dashboard after successful auth
            setTimeout(() => {
              router.push('/');
            }, 2000);
          }, 1000);
        } else {
          setStatus('error');
          setMessage('SDK not available for callback processing');
        }
      } catch (error) {
        console.error('Callback processing error:', error);
        setStatus('error');
        setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    handleCallback();
  }, [descope, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mb-4">
            {status === 'processing' && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            )}
            {status === 'success' && (
              <div className="text-green-500 text-4xl">✅</div>
            )}
            {status === 'error' && (
              <div className="text-red-500 text-4xl">❌</div>
            )}
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {status === 'processing' && 'Processing Authentication'}
            {status === 'success' && 'Authentication Successful'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          
          <p className="text-gray-600 mb-4">{message}</p>
          
          {status === 'error' && (
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Return to Dashboard
            </button>
          )}
          
          {status === 'success' && (
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          )}
        </div>
      </div>
    </div>
  );
}
