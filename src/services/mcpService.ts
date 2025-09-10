import { MCPResource, MCPTool, MCPResponse, LogEntry, MetricEntry, DeploymentResult, RollbackResult, EnhancedDeploymentResponse, EnhancedRollbackResponse, EnhancedListResponse } from '@/types/mcp';
import { parseError, isAuthError } from '@/utils/errorHandler';
import { tokenRefreshService } from './tokenRefreshService';

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:8001';

class MCPService {
  private pendingRequests: Map<string, Promise<MCPResponse<any>>> = new Map();

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    token?: string,
    retryCount = 0
  ): Promise<MCPResponse<T>> {
    // Create the full URL first
    const url = `${MCP_SERVER_URL}${endpoint}`;
    
    // Create a unique key for this request to enable deduplication
    // Include query parameters in the key for GET requests
    const requestKey = `${url}-${options.method || 'GET'}-${JSON.stringify(options.body || '')}`;
    
    // Check if there's already a pending request for this endpoint
    console.log('🔍 Request deduplication check:', { 
      url, 
      requestKey, 
      hasPending: this.pendingRequests.has(requestKey),
      pendingCount: this.pendingRequests.size,
      pendingKeys: Array.from(this.pendingRequests.keys())
    });
    if (this.pendingRequests.has(requestKey)) {
      console.log('🔄 Request already pending, waiting for existing request...');
      return await this.pendingRequests.get(requestKey)!;
    }
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
    console.log('📞 Request called from:', new Error().stack?.split('\n')[2]?.trim());

    // Create the request promise and store it for deduplication
    const requestPromise = this.executeRequest<T>(url, options, headers);
    this.pendingRequests.set(requestKey, requestPromise);
    console.log('➕ Added request to pending map:', { requestKey, pendingCount: this.pendingRequests.size });

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(requestKey);
      console.log('➖ Removed request from pending map:', { requestKey, pendingCount: this.pendingRequests.size });
    }
  }

  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    headers: Record<string, string>
  ): Promise<MCPResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // Add timeout to detect server offline
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      console.log('📡 Response status:', response.status, response.statusText);

      // Handle 401 Unauthorized - let Descope handle token refresh
      if (response.status === 401) {
        console.log('🔄 401 Unauthorized - session may have expired');
        return { 
          success: false, 
          error: 'Session expired. Please log in again.',
          isAuthError: true
        };
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
    const response = await this.request<{ data: LogEntry[] }>(`/mcp/resources/logs${query ? `?${query}` : ''}`, { method: 'GET' }, token);
    
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
    
    return { success: response.success, data: response.data?.data || [], error: response.error };
  }

  async getMetrics(token: string, limit?: number): Promise<MCPResponse<MetricEntry[]>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString();
    const response = await this.request<{ data: MetricEntry[] }>(`/mcp/resources/metrics${query ? `?${query}` : ''}`, { method: 'GET' }, token);
    
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
    
    return { success: response.success, data: response.data?.data || [], error: response.error };
  }

  async deployService(
    token: string, 
    serviceName: string, 
    version: string, 
    environment: string
  ): Promise<MCPResponse<EnhancedDeploymentResponse>> {
    const response = await this.request<EnhancedDeploymentResponse>('/mcp/tools/deploy_service', {
      method: 'POST',
      body: JSON.stringify({
        arguments: { service_name: serviceName, version, environment }
      })
    }, token);

    // Handle the enhanced response structure
      if (response.success && response.data) {
        console.log('🚀 Enhanced deployment response:', response.data);
        // The backend returns data in result field, but we need to handle the type properly
        const responseData = response.data as { result?: EnhancedDeploymentResponse } & EnhancedDeploymentResponse;
        const enhancedData = responseData.result || responseData;
        return {
          success: true,
          data: enhancedData
        };
      }

    return response;
  }

  async rollbackDeployment(
    token: string, 
    deploymentId: string, 
    reason: string,
    environment: string
  ): Promise<MCPResponse<EnhancedRollbackResponse>> {
    const response = await this.request<EnhancedRollbackResponse>('/mcp/tools/rollback_deployment', {
      method: 'POST',
      body: JSON.stringify({
        arguments: { deployment_id: deploymentId, reason, environment }
      })
    }, token);

    // Handle the enhanced response structure
      if (response.success && response.data) {
        console.log('🔄 Enhanced rollback response:', response.data);
        // The backend returns data in result field, but we need to handle the type properly
        const responseData = response.data as { result?: EnhancedRollbackResponse } & EnhancedRollbackResponse;
        const enhancedData = responseData.result || responseData;
        return {
          success: true,
          data: enhancedData
        };
      }

    return response;
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
