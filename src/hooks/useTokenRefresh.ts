import { useEffect } from 'react';
import { tokenRefreshService } from '@/services/tokenRefreshService';

/**
 * Hook to initialize and manage token refresh functionality
 */
export const useTokenRefresh = () => {
  useEffect(() => {
    // Initialize token refresh service
    // This could include setting up automatic token refresh intervals
    // or other token management logic
    
    console.log('Token refresh service initialized');
    
    // Cleanup function
    return () => {
      // Clear any cached tokens when component unmounts
      tokenRefreshService.clearCache();
    };
  }, []);

  // Return any token refresh utilities if needed
  return {
    refreshToken: tokenRefreshService.refreshToken.bind(tokenRefreshService),
    getValidToken: tokenRefreshService.getValidToken.bind(tokenRefreshService),
    clearCache: tokenRefreshService.clearCache.bind(tokenRefreshService),
  };
};

