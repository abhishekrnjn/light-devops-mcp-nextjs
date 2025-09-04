'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DescopeAuthProps {
  projectId: string;
  flowId: string;
  onSuccess?: (userData: any) => void;
  onError?: (error: any) => void;
}

let isScriptLoaded = false;

export default function DescopeAuth({ projectId, flowId, onSuccess, onError }: DescopeAuthProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const router = useRouter();

  useEffect(() => {
    const initializeDescope = async () => {
      try {
        console.log('🚀 Initializing Descope');

        // Load script if needed
        if (!isScriptLoaded) {
          console.log('📦 Loading Descope script...');
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/@descope/web-component@latest/dist/index.js';
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => {
              isScriptLoaded = true;
              resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });

          await customElements.whenDefined('descope-wc');
          console.log('✅ Descope ready');
        }

        // Set the HTML content that React won't touch
        setHtmlContent(`<descope-wc project-id="${projectId}" flow-id="${flowId}" theme="light"></descope-wc>`);
        setIsReady(true);

        // Set up event listeners after a short delay to ensure DOM is ready
        setTimeout(() => {
          const descopeElement = document.querySelector('descope-wc') as any;
          if (descopeElement) {
            console.log('🎧 Setting up event listeners on element:', descopeElement);

            const handleSuccess = (e: CustomEvent) => {
              console.log('🎉 DESCOPE SUCCESS EVENT TRIGGERED!');
              console.log('📋 Full event detail:', e.detail);
              console.log('📋 Available properties:', Object.keys(e.detail));
              
              // Log each possible token location
              console.log('🔍 Token search results:');
              console.log('  e.detail.sessionToken:', e.detail.sessionToken);
              console.log('  e.detail.session?.sessionToken:', e.detail.session?.sessionToken);
              console.log('  e.detail.token:', e.detail.token);
              console.log('  e.detail.accessToken:', e.detail.accessToken);
              console.log('  e.detail.jwt:', e.detail.jwt);
              
              // If there's a session object, log its properties
              if (e.detail.session) {
                console.log('📦 Session object properties:', Object.keys(e.detail.session));
                console.log('📦 Full session object:', e.detail.session);
              }
              
              // Log user object
              if (e.detail.user) {
                console.log('👤 User object properties:', Object.keys(e.detail.user));
                console.log('👤 Full user object:', e.detail.user);
              }
              
              const sessionToken = e.detail.sessionToken || 
                                   e.detail.session?.sessionToken || 
                                   e.detail.token ||
                                   e.detail.accessToken ||
                                   e.detail.jwt;
              
              console.log('✅ Final extracted sessionToken:', sessionToken);
              console.log('🔢 Token length:', sessionToken?.length || 'undefined');
              
              const userData = {
                userId: e.detail.user?.userId || 'unknown',
                name: e.detail.user?.name || 'User',
                email: e.detail.user?.email || '',
                sessionToken: sessionToken,
                // Extract roles and permissions from Descope response
                roles: e.detail.user?.roles || [],
                permissions: e.detail.user?.permissions || [],
                scopes: e.detail.user?.scopes || [],
                tenant: e.detail.user?.tenant || 'default',
                _debug: e.detail,
                _timestamp: new Date().toISOString()
              };
              
              console.log('💾 Storing user data:', userData);
              localStorage.setItem('user_data', JSON.stringify(userData));
              
              // Verify storage
              const stored = localStorage.getItem('user_data');
              console.log('✅ Verification - stored data:', stored ? JSON.parse(stored) : 'STORAGE FAILED');
              
              console.log('🚀 Attempting redirect to dashboard...');
              if (onSuccess) {
                console.log('📞 Calling onSuccess callback');
                onSuccess(userData);
              } else {
                console.log('🔄 Using router.push to /dashboard');
                router.push('/dashboard');
              }
            };

            const handleError = (e: CustomEvent) => {
              console.error('❌ Descope error event:', e.detail);
              if (onError) {
                onError(e.detail);
              }
            };

            console.log('➕ Adding success event listener...');
            descopeElement.addEventListener('success', handleSuccess);
            console.log('➕ Adding error event listener...');
            descopeElement.addEventListener('error', handleError);
            
            console.log('✅ Event listeners successfully added');
          } else {
            console.error('❌ Could not find descope-wc element for event listeners');
          }
        }, 500); // Increased delay to ensure element is fully ready

      } catch (err) {
        console.error('❌ Failed to initialize Descope:', err);
        setError('Failed to load authentication component');
      }
    };

    initializeDescope();
  }, [projectId, flowId, onSuccess, onError, router]);

  if (error) {
    return (
      <div className="text-center p-6">
        <div className="text-red-600 mb-4">⚠️ Authentication Error</div>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        className="w-full min-h-[400px]"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {!isReady && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      )}
    </div>
  );
}