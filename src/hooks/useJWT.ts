import { getSessionToken, getJwtRoles, getJwtPermissions } from '@descope/nextjs-sdk/client';
import { useCallback, useEffect, useState } from 'react';

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

  return {
    token: sessionToken,
    roles,
    permissions,
    getAuthHeaders,
    isAuthenticated: !!sessionToken,
  };
};
