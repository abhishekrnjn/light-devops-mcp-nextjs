import { useState, useEffect, useCallback, useRef } from 'react';
import { useJWT } from './useJWT';
import { mcpService } from '@/services/mcpService';
import { MCPResource, MCPTool } from '@/types/mcp';
import { parseError, isAuthError as checkIsAuthError } from '@/utils/errorHandler';

export const useMCPConnection = () => {
  const { token, isAuthenticated } = useJWT();
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Lightweight health check that only checks connection status
  const performHealthCheck = useCallback(async () => {
    if (!token) {
      console.log('🔍 Health check: No token available');
      return;
    }
    
    try {
      console.log('🔍 Health check: Checking MCP connection...');
      // Only check one endpoint for health check to minimize load
      const response = await mcpService.getResources(token);
      const wasConnected = response.success;
      
      console.log('🔍 Health check result:', { wasConnected, isConnected, response: response.success ? 'success' : response.error });
      
      // Only update state if connection status changed
      if (wasConnected !== isConnected) {
        console.log('🔍 Connection status changed:', { from: isConnected, to: wasConnected });
        setIsConnected(wasConnected);
        if (wasConnected) {
          setError(null);
          setIsAuthError(false);
          setLastHealthCheck(Date.now());
        } else {
          setError(response.error || 'MCP server connection lost');
          setIsAuthError(response.isAuthError || false);
        }
      }
    } catch (error) {
      console.log('🔍 Health check error:', error);
      // Only update if we were previously connected
      if (isConnected) {
        setIsConnected(false);
        setError(parseError(error));
        setIsAuthError(checkIsAuthError(error));
      }
    }
  }, [token, isConnected]);

  // Initial data fetch
  const fetchMCPData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    setIsAuthError(false);
    
    try {
      const [resourcesResponse, toolsResponse] = await Promise.all([
        mcpService.getResources(token),
        mcpService.getTools(token),
      ]);

      const resourcesSuccess = resourcesResponse.success;
      const toolsSuccess = toolsResponse.success;
      const bothSuccessful = resourcesSuccess && toolsSuccess;

      if (resourcesSuccess) {
        setResources(resourcesResponse.data || []);
      } else {
        setError(resourcesResponse.error || 'Failed to fetch resources');
        setIsAuthError(resourcesResponse.isAuthError || false);
      }
      
      if (toolsSuccess) {
        setTools(toolsResponse.data || []);
      } else {
        // If tools failed but resources succeeded, update error
        if (resourcesSuccess) {
          setError(toolsResponse.error || 'Failed to fetch tools');
          setIsAuthError(toolsResponse.isAuthError || false);
        }
      }
      
      // Only set connected if BOTH requests succeeded
      setIsConnected(bothSuccessful);
      
      if (bothSuccessful) {
        setLastHealthCheck(Date.now());
        setError(null);
        setIsAuthError(false);
      }
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      setError(parseError(error));
      setIsAuthError(checkIsAuthError(error));
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Initial data fetch effect
  useEffect(() => {
    if (!isClient) return;

    if (!isAuthenticated || !token) {
      setResources([]);
      setTools([]);
      setIsConnected(false);
      setError(null);
      setIsAuthError(false);
      setIsLoading(false);
      return;
    }

    fetchMCPData();
  }, [isClient, isAuthenticated, token, fetchMCPData]);

  // Periodic health check effect (separate from data fetch)
  useEffect(() => {
    if (!isClient || !isAuthenticated || !token) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up periodic health check every 30 seconds
    intervalRef.current = setInterval(() => {
      performHealthCheck();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isClient, isAuthenticated, token, performHealthCheck]);

  // Manual refresh function
  const refreshConnection = useCallback(() => {
    if (token && isAuthenticated) {
      fetchMCPData();
    }
  }, [token, isAuthenticated, fetchMCPData]);

  // Memoize mcpService to prevent unnecessary recreations
  const memoizedMcpService = useCallback(() => mcpService, []);

  return {
    resources,
    tools,
    isConnected,
    isLoading: !isClient || isLoading,
    error,
    isAuthError,
    mcpService: memoizedMcpService(),
    refreshConnection,
  };
};
