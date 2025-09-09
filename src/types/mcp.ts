export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  queryParameters?: Record<string, unknown>;
}

export interface MCPTool {
  name: string;
  description: string;
  requiredParameters: string[];
}

export interface MCPResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  isAuthError?: boolean;
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  source: string;
}

export interface MetricEntry {
  name: string;
  value: number;
  timestamp: string;
  unit?: string;
}

export interface DeploymentResult {
  deployment_id: string;
  service_name: string;
  version: string;
  environment: string;
  status: string;
  timestamp: string;
}

export interface RollbackResult {
  rollback_id: string;
  deployment_id: string;
  status: string;
  reason: string;
  environment: string;
  timestamp: string;
}

// Enhanced response types with status codes and metadata
export interface EnhancedDeploymentResponse {
  success: boolean;
  deployment: DeploymentResult;
  message: string;
  metadata: {
    deployment_id: string;
    timestamp: string;
    environment: string;
    service_type: 'test' | 'critical' | 'experimental' | 'standard';
  };
}

export interface EnhancedRollbackResponse {
  success: boolean;
  rollback: RollbackResult;
  message: string;
  metadata: {
    rollback_id: string;
    deployment_id: string;
    timestamp: string;
    environment: string;
    reason_type: 'critical' | 'test' | 'experimental' | 'standard';
  };
}

export interface EnhancedListResponse<T> {
  success: boolean;
  deployments?: T[];
  rollbacks?: T[];
  count: number;
  message: string;
  metadata: {
    timestamp: string;
    total_deployments?: number;
    total_rollbacks?: number;
    environments: string[];
    status_summary: {
      success: number;
      failed: number;
      in_progress: number;
    };
  };
}

// New types for REST API responses
export interface DeploymentEntry {
  deployment_id: string;
  service_name: string;
  version: string;
  environment: string;
  status: string;
  timestamp: string;
}

export interface RollbackEntry {
  rollback_id: string;
  deployment_id: string;
  status: string;
  reason: string;
  timestamp: string;
}

export interface DeployRequest {
  service_name: string;
  version: string;
  environment: string;
}

export interface RollbackRequest {
  deployment_id: string;
  reason: string;
  environment: string;
}
