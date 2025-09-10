import { useState, useEffect, useCallback, useRef } from 'react';
import { useJWT } from './useJWT';
import { mcpService } from '@/services/mcpService';
import { MCPResource, MCPTool } from '@/types/mcp';
import { parseError, isAuthError as checkIsAuthError } from '@/utils/errorHandler';

// Removed isTokenExpired function - let Descope handle token refresh automatically

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
  const hasFetchedRef = useRef<boolean>(false);
  const lastTokenRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Lightweight health check that only checks connection status
  const performHealthCheck = useCallback(async () => {
    if (!token) {
      console.log('🔍 Health check: No token available');
      return;
    }

    // Let Descope handle token refresh automatically
    // Don't check token expiry here as it can be too aggressive

    // Skip health check if we've checked recently (within 2 minutes)
    const timeSinceLastCheck = Date.now() - lastHealthCheck;
    if (timeSinceLastCheck < 120000) { // 2 minutes
      console.log('⏭️ Skipping health check - checked recently');
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
      } else if (wasConnected) {
        // Update last check time even if status didn't change
        setLastHealthCheck(Date.now());
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
  }, [token, isConnected, lastHealthCheck]);

  // Initial data fetch
  const fetchMCPData = useCallback(async (currentToken: string) => {
    console.log('🔄 fetchMCPData called with token:', currentToken ? currentToken.substring(0, 20) + '...' : 'null');
    
    if (!currentToken) {
      console.log('❌ fetchMCPData: No token provided');
      return;
    }

    // Prevent multiple concurrent fetches
    if (isFetchingRef.current) {
      console.log('⏭️ Data fetch already in progress, skipping...');
      return;
    }

    // Let Descope handle token refresh automatically
    // Don't check token expiry here as it can be too aggressive

    console.log('🚀 fetchMCPData: Starting data fetch...');
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    setIsAuthError(false);
    
    try {
      console.log('📡 fetchMCPData: Making API calls to MCP server...');
      const [resourcesResponse, toolsResponse] = await Promise.all([
        mcpService.getResources(currentToken),
        mcpService.getTools(currentToken),
      ]);
      
      console.log('📋 fetchMCPData: API responses received:', {
        resourcesSuccess: resourcesResponse.success,
        toolsSuccess: toolsResponse.success,
        resourcesError: resourcesResponse.error,
        toolsError: toolsResponse.error
      });

      const resourcesSuccess = resourcesResponse.success;
      const toolsSuccess = toolsResponse.success;
      const bothSuccessful = resourcesSuccess && toolsSuccess;

      if (resourcesSuccess) {
        setResources(resourcesResponse.data || []);
      } else {
        const errorMessage = resourcesResponse.error || 'Failed to fetch resources';
        console.error('❌ Resources fetch failed:', errorMessage);
        setError(errorMessage);
        setIsAuthError(resourcesResponse.isAuthError || false);
        
        // If it's an auth error, suggest re-authentication
        if (resourcesResponse.isAuthError) {
          console.log('🔐 Authentication error detected - user may need to re-login');
        }
      }
      
      if (toolsSuccess) {
        setTools(toolsResponse.data || []);
      } else {
        const errorMessage = toolsResponse.error || 'Failed to fetch tools';
        console.error('❌ Tools fetch failed:', errorMessage);
        
        // If tools failed but resources succeeded, update error
        if (resourcesSuccess) {
          setError(errorMessage);
          setIsAuthError(toolsResponse.isAuthError || false);
          
          // If it's an auth error, suggest re-authentication
          if (toolsResponse.isAuthError) {
            console.log('🔐 Authentication error detected in tools - user may need to re-login');
          }
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
      isFetchingRef.current = false;
    }
  }, []);

  // Initial data fetch effect
  useEffect(() => {
    console.log('🔍 useMCPConnection useEffect triggered:', { 
      isClient, 
      isAuthenticated, 
      hasToken: !!token, 
      hasFetched: hasFetchedRef.current, 
      lastToken: lastTokenRef.current,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
    });
    
    if (!isClient) {
      console.log('⏭️ useMCPConnection: Not client yet');
      return;
    }

    if (!isAuthenticated || !token) {
      console.log('⏭️ useMCPConnection: Not authenticated or no token', { isAuthenticated, hasToken: !!token });
      setResources([]);
      setTools([]);
      setIsConnected(false);
      setError(null);
      setIsAuthError(false);
      setIsLoading(false);
      hasFetchedRef.current = false;
      lastTokenRef.current = null;
      isFetchingRef.current = false;
      return;
    }

    // Check if we've already fetched data for this token
    if (hasFetchedRef.current && lastTokenRef.current === token) {
      console.log('⏭️ Skipping data fetch - already fetched for this token');
      return;
    }

    console.log('🚀 useMCPConnection calling fetchMCPData');
    hasFetchedRef.current = true;
    lastTokenRef.current = token;
    fetchMCPData(token);
  }, [isClient, isAuthenticated, token, fetchMCPData]);

  // Periodic health check effect (separate from data fetch)
  useEffect(() => {
    if (!isClient || !isAuthenticated || !token) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Adaptive health check interval:
    // - If connected: check every 10 minutes
    // - If disconnected: check every 2 minutes to try to reconnect
    const intervalTime = isConnected ? 600000 : 120000; // 10 min vs 2 min
    
    console.log(`🔍 Setting up health check interval: ${intervalTime / 1000}s (${isConnected ? 'connected' : 'disconnected'})`);
    
    intervalRef.current = setInterval(() => {
      performHealthCheck();
    }, intervalTime);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isClient, isAuthenticated, token, performHealthCheck, isConnected]);

  // Manual refresh function
  const refreshConnection = useCallback(() => {
    if (token && isAuthenticated) {
      hasFetchedRef.current = false; // Reset the fetch flag to allow re-fetch
      fetchMCPData(token);
    }
  }, [token, isAuthenticated, fetchMCPData]);

  return {
    resources,
    tools,
    isConnected,
    isLoading: !isClient || isLoading,
    error,
    isAuthError,
    mcpService,
    refreshConnection,
  };
};
