import { MCPResource, MCPTool, MCPResponse, LogEntry, MetricEntry, DeploymentResult, RollbackResult } from '@/types/mcp';

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:8001';

class MCPService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    token?: string
  ): Promise<MCPResponse<T>> {
    const url = `${MCP_SERVER_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Sending JWT token:', token.substring(0, 20) + '...');
    }

    console.log('🌐 Making request to:', url);
    console.log('📋 Headers:', headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Error response:', error);
        return { success: false, error };
      }

      const data = await response.json();
      console.log('✅ Success response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('💥 Request error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getResources(token: string): Promise<MCPResponse<MCPResource[]>> {
    return this.request<MCPResource[]>('/mcp/resources', { method: 'GET' }, token);
  }

  async getTools(token: string): Promise<MCPResponse<MCPTool[]>> {
    return this.request<MCPTool[]>('/mcp/tools', { method: 'GET' }, token);
  }

  async getLogs(token: string, level?: string, limit?: number): Promise<MCPResponse<LogEntry[]>> {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString();
    return this.request<LogEntry[]>(`/mcp/resources/logs${query ? `?${query}` : ''}`, { method: 'GET' }, token);
  }

  async getMetrics(token: string, limit?: number): Promise<MCPResponse<MetricEntry[]>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString();
    return this.request<MetricEntry[]>(`/mcp/resources/metrics${query ? `?${query}` : ''}`, { method: 'GET' }, token);
  }

  async deployService(
    token: string, 
    serviceName: string, 
    version: string, 
    environment: string
  ): Promise<MCPResponse<DeploymentResult>> {
    return this.request<DeploymentResult>('/mcp/tools/deploy_service', {
      method: 'POST',
      body: JSON.stringify({
        arguments: { service_name: serviceName, version, environment }
      })
    }, token);
  }

  async rollbackDeployment(
    token: string, 
    deploymentId: string, 
    reason: string
  ): Promise<MCPResponse<RollbackResult>> {
    return this.request<RollbackResult>('/mcp/tools/rollback_deployment', {
      method: 'POST',
      body: JSON.stringify({
        arguments: { deployment_id: deploymentId, reason }
      })
    }, token);
  }

  async authenticateUser(token: string): Promise<MCPResponse<unknown>> {
    // For authenticate_user, we need to send the token in both header and body
    return this.request('/mcp/tools/authenticate_user', {
      method: 'POST',
      body: JSON.stringify({
        arguments: { session_token: token }
      })
    }, token);
  }
}

export const mcpService = new MCPService();
