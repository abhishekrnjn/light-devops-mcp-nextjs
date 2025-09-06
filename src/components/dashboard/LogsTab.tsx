'use client';

import { useState, useEffect, useCallback } from 'react';
import { useJWT } from '@/hooks/useJWT';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { LogEntry } from '@/types/mcp';

export const LogsTab = () => {
  const { token } = useJWT();
  const { mcpService } = useMCPConnection();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ level: '', limit: 10 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mcpService.getLogs(token, filters.level || undefined, filters.limit);
      if (response.success) {
        // Ensure we always set an array
        const logsData = Array.isArray(response.data) ? response.data : [];
        setLogs(logsData);
      } else {
        setError(response.error || 'Failed to fetch logs');
        setLogs([]); // Reset to empty array on error
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to fetch logs');
      setLogs([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [token, filters, mcpService]);

  useEffect(() => {
    if (isClient) {
      fetchLogs();
    }
  }, [isClient, token, filters, fetchLogs]);

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'text-red-600 bg-red-100';
      case 'WARN': return 'text-yellow-600 bg-yellow-100';
      case 'INFO': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">System Logs</h3>
          <div className="px-4 py-2 bg-gray-300 text-white rounded">
            Loading...
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System Logs</h3>
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
          value={filters.level}
          onChange={(e) => setFilters({ ...filters, level: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">All Levels</option>
          <option value="ERROR">Error</option>
          <option value="WARN">Warning</option>
          <option value="INFO">Info</option>
        </select>
        <input
          type="number"
          value={filters.limit}
          onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) || 10 })}
          placeholder="Limit"
          className="border border-gray-300 rounded px-3 py-2 w-20"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        {!Array.isArray(logs) || logs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No logs found</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="text-xs text-gray-500">{log.timestamp}</span>
                </div>
                <p className="text-sm text-gray-800">{log.message}</p>
                <p className="text-xs text-gray-500 mt-1">Source: {log.source}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
