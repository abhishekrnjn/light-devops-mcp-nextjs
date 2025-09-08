import { getSessionToken, getJwtRoles, getJwtPermissions } from '@descope/nextjs-sdk/client';
import { useCallback, useEffect, useState } from 'react';
import { tokenRefreshService } from '@/services/tokenRefreshService';

export const useJWT = () => {
  const [isClient, setIsClient] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    try {
      const token = getSessionToken();
      const userRoles = getJwtRoles(token);
      const userPermissions = getJwtPermissions(token);
      
      setSessionToken(token);
      setRoles(userRoles || []);
      setPermissions(userPermissions || []);
    } catch (error) {
      console.error('Error getting JWT data:', error);
      setSessionToken(null);
      setRoles([]);
      setPermissions([]);
    }
  }, [isClient]);

  const getAuthHeaders = useCallback(() => {
    if (!sessionToken) return {};
    return { Authorization: `Bearer ${sessionToken}` };
  }, [sessionToken]);

  const getValidToken = useCallback(async () => {
    return await tokenRefreshService.getValidToken();
  }, []);

  const refreshTokenAndUpdate = useCallback(async () => {
    const newToken = await tokenRefreshService.refreshToken();
    if (newToken) {
      // Update local state with new token data
      try {
        const userRoles = getJwtRoles(newToken);
        const userPermissions = getJwtPermissions(newToken);
        
        setSessionToken(newToken);
        setRoles(userRoles || []);
        setPermissions(userPermissions || []);
        
        return newToken;
      } catch (error) {
        console.error('Error updating token data:', error);
        return null;
      }
    }
    return null;
  }, []);

  return {
    token: sessionToken,
    roles,
    permissions,
    getAuthHeaders,
    getValidToken,
    refreshToken: refreshTokenAndUpdate,
    isAuthenticated: !!sessionToken,
  };
};
