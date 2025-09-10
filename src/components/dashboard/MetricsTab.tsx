'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useJWT } from '@/hooks/useJWT';
import { mcpService } from '@/services/mcpService';
import { MetricEntry } from '@/types/mcp';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

interface MetricsTabProps {
  isConnected?: boolean;
  isLoading?: boolean;
}

export const MetricsTab = ({ isConnected = false, isLoading: mcpLoading = false }: MetricsTabProps) => {
  const { token } = useJWT();
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const [isClient, setIsClient] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);
  const mcpServiceRef = useRef(mcpService);
  const fetchMetricsRef = useRef<(() => Promise<void>) | null>(null);
  const tokenRef = useRef(token);
  const isConnectedRef = useRef(isConnected);
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
    limitRef.current = limit;
    hasRequestedRef.current = false; // Reset when limit changes
  }, [limit]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);


  const fetchMetrics = useCallback(async () => {
    const currentToken = tokenRef.current;
    const currentIsConnected = isConnectedRef.current;
    const currentLimit = limitRef.current;
    const currentIsLoading = isLoadingRef.current;
    
    console.log('🔄 fetchMetrics called with:', { token: !!currentToken, isConnected: currentIsConnected, limit: currentLimit, hasRequested: hasRequestedRef.current });
    
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
      console.log('📡 Making request to getMetrics...');
      const response = await mcpServiceRef.current.getMetrics(currentToken, currentLimit);
      console.log('📊 MetricsTab received response:', response);
      
      if (response.success) {
        // Ensure we always set an array
        const metricsData = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Setting metrics data:', metricsData.length, 'entries');
        setMetrics(metricsData);
      } else {
        console.log('❌ Response not successful:', response.error);
        setError(response.error || 'Failed to fetch metrics');
        setMetrics([]); // Reset to empty array on error
      }
    } catch (error) {
      console.error('💥 Error fetching metrics:', error);
      setError('Failed to fetch metrics');
      setMetrics([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update the ref after fetchMetrics is defined - inside useEffect to prevent instability
  useEffect(() => {
    fetchMetricsRef.current = fetchMetrics;
  }, [fetchMetrics]);

  useEffect(() => {
    console.log('🔍 MetricsTab useEffect triggered:', { isClient, hasToken: !!token, isConnected, limit, hasRequested: hasRequestedRef.current });
    if (isClient && token && isConnected && !hasRequestedRef.current) {
      console.log('🚀 MetricsTab calling fetchMetrics');
      fetchMetricsRef.current?.();
    }
  }, [isClient, token, isConnected, limit]);

  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">System Metrics</h3>
          <div className="px-4 py-2 bg-gray-300 text-white rounded">
            Loading...
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">System Metrics</h3>
        <div className="flex space-x-2">
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
            placeholder="Limit"
            className="border border-gray-300 rounded px-3 py-2 w-20 text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <ErrorDisplay 
        error={error} 
        onRetry={fetchMetrics}
        className="mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!hasCheckedConnection || isLoading || mcpLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading metrics...</p>
          </div>
        ) : !isConnected ? (
          <div className="col-span-full text-center py-8">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-slate-600 mb-2">MCP Server Offline</p>
            <p className="text-sm text-slate-500">Metrics cannot be fetched while the server is offline.</p>
          </div>
        ) : Array.isArray(metrics) && metrics.length > 0 ? (
          metrics.map((metric, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">{metric.name}</h4>
                <span className="text-xs text-slate-600">{metric.timestamp}</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {metric.value} {metric.unit || ''}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-slate-600">No metrics available</p>
          </div>
        )}
      </div>
    </div>
  );
};
