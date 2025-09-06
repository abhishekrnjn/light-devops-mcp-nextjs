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
  service_name: string;
  version: string;
  environment: string;
  status: string;
  timestamp: string;
}

export interface RollbackResult {
  deployment_id: string;
  reason: string;
  status: string;
  timestamp: string;
}
