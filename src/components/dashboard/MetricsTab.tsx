'use client';

import { useState, useEffect, useCallback } from 'react';
import { useJWT } from '@/hooks/useJWT';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { MetricEntry } from '@/types/mcp';

export const MetricsTab = () => {
  const { token } = useJWT();
  const { mcpService } = useMCPConnection();
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchMetrics = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mcpService.getMetrics(token, limit);
      if (response.success) {
        // Ensure we always set an array
        const metricsData = Array.isArray(response.data) ? response.data : [];
        setMetrics(metricsData);
      } else {
        setError(response.error || 'Failed to fetch metrics');
        setMetrics([]); // Reset to empty array on error
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to fetch metrics');
      setMetrics([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [token, limit, mcpService]);

  useEffect(() => {
    if (isClient) {
      fetchMetrics();
    }
  }, [isClient, token, limit, fetchMetrics]);

  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">System Metrics</h3>
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
        <h3 className="text-lg font-semibold">System Metrics</h3>
        <div className="flex space-x-2">
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
            placeholder="Limit"
            className="border border-gray-300 rounded px-3 py-2 w-20"
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(metrics) && metrics.map((metric, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{metric.name}</h4>
              <span className="text-xs text-gray-500">{metric.timestamp}</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {metric.value} {metric.unit || ''}
            </div>
          </div>
        ))}
      </div>

      {(!Array.isArray(metrics) || metrics.length === 0) && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No metrics available</p>
        </div>
      )}
    </div>
  );
};
