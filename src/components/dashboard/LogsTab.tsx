'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useJWT } from '@/hooks/useJWT';
import { mcpService } from '@/services/mcpService';
import { LogEntry } from '@/types/mcp';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

interface LogsTabProps {
  isConnected?: boolean;
  isLoading?: boolean;
}

export const LogsTab = ({ isConnected = false, isLoading: mcpLoading = false }: LogsTabProps) => {
  const { token } = useJWT();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState('');
  const [limit, setLimit] = useState(10);
  const [isClient, setIsClient] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);
  const mcpServiceRef = useRef(mcpService);
  const fetchLogsRef = useRef<(() => Promise<void>) | null>(null);
  const tokenRef = useRef(token);
  const isConnectedRef = useRef(isConnected);
  const levelRef = useRef(level);
  const limitRef = useRef(limit);
  const isLoadingRef = useRef(isLoading);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Track when we've checked the connection status
  useEffect(() => {
    if (isClient) {
      setHasCheckedConnection(true);
    }
  }, [isClient, isConnected]);

  // Update the refs when they change
  useEffect(() => {
    mcpServiceRef.current = mcpService;
  }, [mcpService]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    levelRef.current = level;
    hasRequestedRef.current = false; // Reset when level changes
  }, [level]);

  useEffect(() => {
    limitRef.current = limit;
    hasRequestedRef.current = false; // Reset when limit changes
  }, [limit]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);


  const fetchLogs = useCallback(async () => {
    const currentToken = tokenRef.current;
    const currentIsConnected = isConnectedRef.current;
    const currentLevel = levelRef.current;
    const currentLimit = limitRef.current;
    const currentIsLoading = isLoadingRef.current;
    
    console.log('🔄 fetchLogs called with:', { token: !!currentToken, isConnected: currentIsConnected, level: currentLevel, limit: currentLimit, hasRequested: hasRequestedRef.current });
    
    if (!currentToken) {
      console.log('❌ No token available');
      return;
    }
    
    if (!currentIsConnected) {
      console.log('❌ MCP server not connected');
      return;
    }

    // Prevent multiple concurrent requests
    if (currentIsLoading) {
      console.log('⏭️ Request already in progress, skipping...');
      return;
    }

    // Prevent duplicate requests for the same parameters
    if (hasRequestedRef.current) {
      console.log('⏭️ Request already made for current parameters, skipping...');
      return;
    }

    hasRequestedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log('📡 Making request to getLogs...');
      const response = await mcpServiceRef.current.getLogs(currentToken, currentLevel || undefined, currentLimit);
      console.log('📋 LogsTab received response:', response);
      
      if (response.success) {
        // Ensure we always set an array
        const logsData = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Setting logs data:', logsData.length, 'entries');
        setLogs(logsData);
      } else {
        console.log('❌ Response not successful:', response.error);
        setError(response.error || 'Failed to fetch logs');
        setLogs([]); // Reset to empty array on error
      }
    } catch (error) {
      console.error('💥 Error fetching logs:', error);
      setError('Failed to fetch logs');
      setLogs([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update the ref after fetchLogs is defined - inside useEffect to prevent instability
  useEffect(() => {
    fetchLogsRef.current = fetchLogs;
  }, [fetchLogs]);

  useEffect(() => {
    console.log('🔍 LogsTab useEffect triggered:', { 
      isClient, 
      hasToken: !!token, 
      isConnected, 
      level, 
      limit,
      hasRequested: hasRequestedRef.current,
      mcpLoading
    });
    if (isClient && token && isConnected && !hasRequestedRef.current) {
      console.log('🚀 LogsTab calling fetchLogs');
      fetchLogsRef.current?.();
    } else {
      console.log('⏭️ LogsTab not calling fetchLogs:', {
        isClient,
        hasToken: !!token,
        isConnected,
        hasRequested: hasRequestedRef.current,
        mcpLoading
      });
    }
  }, [isClient, token, isConnected, level, limit, mcpLoading]);

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'text-red-600 bg-red-100';
      case 'WARN': return 'text-yellow-600 bg-yellow-100';
      case 'INFO': return 'text-blue-600 bg-blue-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">System Logs</h3>
          <div className="px-4 py-2 bg-gray-300 text-white rounded">
            Loading...
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">System Logs</h3>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="flex space-x-4">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Levels</option>
          <option value="ERROR">Error</option>
          <option value="WARN">Warning</option>
          <option value="INFO">Info</option>
        </select>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
          placeholder="Limit"
          className="border border-gray-300 rounded px-3 py-2 w-20 text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

              <ErrorDisplay 
                error={error} 
                onRetry={fetchLogs}
                className="mb-4"
              />

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {!hasCheckedConnection || isLoading || mcpLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading logs...</p>
                    <p className="text-xs text-slate-500 mt-2">Connection status: {isConnected ? 'Connected' : 'Disconnected'}</p>
                  </div>
                ) : !isConnected ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-slate-600 mb-2">MCP Server Offline</p>
                    <p className="text-sm text-slate-500">Logs cannot be fetched while the server is offline.</p>
                    <p className="text-xs text-slate-400 mt-2">Debug: isClient={isClient.toString()}, hasToken={!!token}, isConnected={isConnected.toString()}, mcpLoading={mcpLoading.toString()}</p>
                  </div>
                ) : !Array.isArray(logs) || logs.length === 0 ? (
                  <p className="text-slate-600 text-center py-4">No logs found</p>
                ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="text-xs text-slate-600">{log.timestamp}</span>
                </div>
                <p className="text-sm text-slate-800">{log.message}</p>
                <p className="text-xs text-slate-600 mt-1">Source: {log.source}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
