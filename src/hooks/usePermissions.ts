import { useEffect, useState } from 'react';
import { useJWT } from './useJWT';
import { permissionService } from '@/services/permissionService';
import { UserPermissions } from '@/types/permissions';

export const usePermissions = () => {
  const { token, isAuthenticated, roles, permissions: jwtPermissions } = useJWT();
  const [permissions, setPermissions] = useState<UserPermissions>({
    read_logs: false,
    read_metrics: false,
    deploy_staging: false,
    deploy_production: false,
    rollback_deployment: false,
    authenticate_user: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (!isAuthenticated || !token) {
      setPermissions({
        read_logs: false,
        read_metrics: false,
        deploy_staging: false,
        deploy_production: false,
        rollback_deployment: false,
        authenticate_user: false,
      });
      return;
    }

    const loadPermissions = () => {
      setIsLoading(true);
      try {
        console.log('🔑 Descope JWT token:', token);
        console.log('🔍 User roles:', roles);
        console.log('🔍 JWT permissions:', jwtPermissions);
        
        // Set permissions from JWT roles
        permissionService.setPermissionsFromJWT();
        const userPermissions = permissionService.getAllPermissions();
        setPermissions(userPermissions);
        
        console.log('✅ Permissions loaded from JWT:', userPermissions);
      } catch (error) {
        console.error('Failed to load permissions from JWT:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [isClient, isAuthenticated, token, roles, jwtPermissions]);

  return {
    permissions,
    isLoading: !isClient || isLoading,
    hasPermission: permissionService.hasPermission.bind(permissionService),
    canAccessResource: permissionService.canAccessResource.bind(permissionService),
    canAccessTool: permissionService.canAccessTool.bind(permissionService),
    getAvailableTabs: permissionService.getAvailableTabs.bind(permissionService),
  };
};
