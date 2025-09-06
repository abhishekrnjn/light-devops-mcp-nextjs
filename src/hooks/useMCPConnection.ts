import { useState, useEffect } from 'react';
import { useJWT } from './useJWT';
import { mcpService } from '@/services/mcpService';
import { MCPResource, MCPTool } from '@/types/mcp';

export const useMCPConnection = () => {
  const { token, isAuthenticated } = useJWT();
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (!isAuthenticated || !token) {
      setResources([]);
      setTools([]);
      setIsConnected(false);
      return;
    }

    const fetchMCPData = async () => {
      setIsLoading(true);
      try {
        const [resourcesResponse, toolsResponse] = await Promise.all([
          mcpService.getResources(token),
          mcpService.getTools(token),
        ]);

        if (resourcesResponse.success) {
          setResources(resourcesResponse.data || []);
        }
        if (toolsResponse.success) {
          setTools(toolsResponse.data || []);
        }
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect to MCP server:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMCPData();
  }, [isClient, isAuthenticated, token]);

  return {
    resources,
    tools,
    isConnected,
    isLoading: !isClient || isLoading,
    mcpService,
  };
};
