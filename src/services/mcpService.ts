import { MCPResource, MCPTool, MCPResponse, LogEntry, MetricEntry, DeploymentResult, RollbackResult } from '@/types/mcp';
import { parseError, isAuthError } from '@/utils/errorHandler';
import { tokenRefreshService } from './tokenRefreshService';

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:8001';

class MCPService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    token?: string,
    retryCount = 0
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

      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401 && retryCount === 0) {
        console.log('🔄 401 Unauthorized - attempting token refresh...');
        
        const refreshedToken = await tokenRefreshService.refreshToken();
        if (refreshedToken) {
          console.log('✅ Token refreshed, retrying request...');
          // Retry the request with the new token
          return this.request<T>(endpoint, options, refreshedToken, retryCount + 1);
        } else {
          console.error('❌ Token refresh failed');
          return { 
            success: false, 
            error: 'Session expired. Please log in again.',
            isAuthError: true
          };
        }
      }

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
    
    console.log('📋 getLogs full response:', JSON.stringify(response, null, 2));
    
    // Use original working logic but with debugging
    if (response.success && response.data?.data) {
      console.log('✅ Found response.data.data:', response.data.data);
      console.log('✅ Data is array:', Array.isArray(response.data.data));
      console.log('✅ Data length:', response.data.data.length);
      return { success: true, data: response.data.data };
    }
    
    console.log('❌ Original extraction failed. Response structure:', {
      success: response.success,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : 'no data',
      hasDataData: response.data?.data !== undefined
    });
    
    return response;
  }

  async getMetrics(token: string, limit?: number): Promise<MCPResponse<MetricEntry[]>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString();
    const response = await this.request<any>(`/mcp/resources/metrics${query ? `?${query}` : ''}`, { method: 'GET' }, token);
    
    console.log('📊 getMetrics full response:', JSON.stringify(response, null, 2));
    
    // Use original working logic but with debugging
    if (response.success && response.data?.data) {
      console.log('✅ Found response.data.data:', response.data.data);
      console.log('✅ Data is array:', Array.isArray(response.data.data));
      console.log('✅ Data length:', response.data.data.length);
      return { success: true, data: response.data.data };
    }
    
    console.log('❌ Original extraction failed. Response structure:', {
      success: response.success,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : 'no data',
      hasDataData: response.data?.data !== undefined
    });
    
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
    return this.request<RollbackResult>('/mcp/tools/rollback_deployment', {
      method: 'POST',
      body: JSON.stringify({
        arguments: { deployment_id: deploymentId, reason, environment }
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
