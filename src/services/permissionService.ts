import { UserPermissions } from '@/types/permissions';
import { getJwtRoles, getJwtPermissions } from '@descope/nextjs-sdk/client';

// Map Descope roles to our permission structure
const mapRolesToPermissions = (roles: string[]): UserPermissions => {
  const permissions: UserPermissions = {
    read_logs: false,
    read_metrics: false,
    deploy_staging: false,
    deploy_production: false,
    rollback_staging: false,
    rollback_production: false,
    authenticate_user: false,
  };

  // Map roles to permissions
  roles.forEach(role => {
    switch (role.toLowerCase()) {
      case 'admin':
        permissions.read_logs = true;
        permissions.read_metrics = true;
        permissions.deploy_staging = true;
        permissions.deploy_production = true;
        permissions.rollback_staging = true;
        permissions.rollback_production = true;
        permissions.authenticate_user = true;
        break;
      case 'developer':
        permissions.read_logs = true;
        permissions.read_metrics = true;
        permissions.deploy_staging = true;
        permissions.authenticate_user = true;
        break;
      case 'viewer':
        permissions.read_logs = true;
        permissions.read_metrics = true;
        permissions.authenticate_user = true;
        break;
      case 'observer':
        permissions.read_logs = true;
        permissions.read_metrics = true;
        permissions.authenticate_user = true;
        break;
      case 'operator':
        permissions.read_logs = true;
        permissions.read_metrics = true;
        permissions.deploy_staging = true;
        permissions.deploy_production = true;
        permissions.rollback_staging = true;
        permissions.rollback_production = true;
        permissions.authenticate_user = true;
        break;
    }
  });

  return permissions;
};

export class PermissionService {
  private permissions: UserPermissions = {
    read_logs: false,
    read_metrics: false,
    deploy_staging: false,
    deploy_production: false,
    rollback_staging: false,
    rollback_production: false,
    authenticate_user: false,
  };

  setPermissions(permissions: Partial<UserPermissions>): void {
    this.permissions = { ...this.permissions, ...permissions };
  }

  setPermissionsFromJWT(): void {
    try {
      const roles = getJwtRoles();
      const jwtPermissions = getJwtPermissions();
      
      console.log('🔍 JWT Roles:', roles);
      console.log('🔍 JWT Permissions:', jwtPermissions);
      
      // Start with role-based permissions
      let permissions = mapRolesToPermissions(roles);
      
      console.log('📋 Role-based permissions:', permissions);
      
      // Override with explicit JWT permissions if available
      if (jwtPermissions && jwtPermissions.length > 0) {
        console.log('🔄 Applying JWT permissions...');
        jwtPermissions.forEach(perm => {
          console.log(`  - Processing permission: ${perm}`);
          switch (perm) {
            case 'read_logs':
              permissions.read_logs = true;
              console.log('    ✅ Set read_logs = true');
              break;
            case 'read_metrics':
              permissions.read_metrics = true;
              console.log('    ✅ Set read_metrics = true');
              break;
            case 'deploy_staging':
              permissions.deploy_staging = true;
              console.log('    ✅ Set deploy_staging = true');
              break;
            case 'deploy_production':
              permissions.deploy_production = true;
              console.log('    ✅ Set deploy_production = true');
              break;
            case 'rollback_staging':
              permissions.rollback_staging = true;
              console.log('    ✅ Set rollback_staging = true');
              break;
            case 'rollback_production':
              permissions.rollback_production = true;
              console.log('    ✅ Set rollback_production = true');
              break;
            case 'authenticate_user':
              permissions.authenticate_user = true;
              console.log('    ✅ Set authenticate_user = true');
              break;
            default:
              console.log(`    ⚠️ Unknown permission: ${perm}`);
          }
        });
      }
      
      this.permissions = permissions;
      console.log('✅ Final permissions set:', this.permissions);
    } catch (error) {
      console.error('Error getting permissions from JWT:', error);
    }
  }

  hasPermission(permission: keyof UserPermissions): boolean {
    return this.permissions[permission];
  }

  canAccessResource(resource: string): boolean {
    // Map resource names to permissions
    const resourcePermissionMap: Record<string, keyof UserPermissions> = {
      'logs': 'read_logs',
      'metrics': 'read_metrics',
      'deploy': 'deploy_staging', // Default to staging for deploy
      'rollback': 'rollback_staging', // Default to staging for rollback
    };
    
    const permission = resourcePermissionMap[resource];
    return permission ? this.hasPermission(permission) : false;
  }

  canAccessTool(tool: string, environment?: string): boolean {
    // Map tool names to permissions
    const toolPermissionMap: Record<string, keyof UserPermissions> = {
      'get_logs': 'read_logs',
      'get_metrics': 'read_metrics',
      'deploy_service': environment === 'production' ? 'deploy_production' : 'deploy_staging',
      'rollback_staging': 'rollback_staging',
      'rollback_production': 'rollback_production',
      'authenticate_user': 'authenticate_user',
    };
    
    const permission = toolPermissionMap[tool];
    return permission ? this.hasPermission(permission) : false;
  }

  getAvailableTabs(): string[] {
    const tabs: string[] = [];
    
    if (this.hasPermission('read_logs')) tabs.push('logs');
    if (this.hasPermission('read_metrics')) tabs.push('metrics');
    if (this.hasPermission('deploy_staging') || this.hasPermission('deploy_production')) tabs.push('deploy');
    if (this.hasPermission('rollback_staging') || this.hasPermission('rollback_production')) tabs.push('rollback');
    tabs.push('ai'); // AI tab is always available
    
    return tabs;
  }

  getAllPermissions(): UserPermissions {
    return { ...this.permissions };
  }
}

export const permissionService = new PermissionService();