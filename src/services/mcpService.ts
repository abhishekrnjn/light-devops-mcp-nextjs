import { MCPResource, MCPTool, MCPResponse, LogEntry, MetricEntry, DeploymentResult, RollbackResult } from '@/types/mcp';
import { parseError, isAuthError } from '@/utils/errorHandler';

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
        // Add timeout to detect server offline
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Error response:', error);
        const formattedError = parseError(error);
        return { success: false, error: formattedError, isAuthError: isAuthError(error) };
      }

      const data = await response.json();
      console.log('✅ Success response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('💥 Request error:', error);
      
      // Check if it's a network error (server offline)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Unable to connect to MCP server. Please check if the server is running.',
          isAuthError: false
        };
      }
      
      // Check if it's a timeout error
      if (error instanceof Error && error.name === 'TimeoutError') {
        return { 
          success: false, 
          error: 'MCP server request timed out. The server may be slow or offline.',
          isAuthError: false
        };
      }
      
      const formattedError = parseError(error);
      return { 
        success: false, 
        error: formattedError,
        isAuthError: isAuthError(error)
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
    const response = await this.request<any>(`/mcp/resources/logs${query ? `?${query}` : ''}`, { method: 'GET' }, token);
    
    // Extract the data array from the backend response
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    
    return response;
  }

  async getMetrics(token: string, limit?: number): Promise<MCPResponse<MetricEntry[]>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString();
    const response = await this.request<any>(`/mcp/resources/metrics${query ? `?${query}` : ''}`, { method: 'GET' }, token);
    
    // Extract the data array from the backend response
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    
    return response;
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
    reason: string,
    environment: string
  ): Promise<MCPResponse<RollbackResult>> {
    const endpoint = environment === 'production' ? '/mcp/tools/rollback_production' : '/mcp/tools/rollback_staging';
    return this.request<RollbackResult>(endpoint, {
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
