export interface UserPermissions {
  read_logs: boolean;
  read_metrics: boolean;
  deploy_staging: boolean;
  deploy_production: boolean;
  rollback_deployment: boolean;
  authenticate_user: boolean;
}

export interface PermissionConfig {
  resource: string;
  requiredPermission: keyof UserPermissions;
}

export const PERMISSION_MAP: Record<string, keyof UserPermissions> = {
  'logs': 'read_logs',
  'metrics': 'read_metrics',
  'deploy_service:staging': 'deploy_staging',
  'deploy_service:production': 'deploy_production',
  'rollback_deployment': 'rollback_deployment',
  'authenticate_user': 'authenticate_user',
};
