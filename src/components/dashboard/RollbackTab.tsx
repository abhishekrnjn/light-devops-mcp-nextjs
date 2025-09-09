'use client';

import { useState, useEffect } from 'react';
import { useJWT } from '@/hooks/useJWT';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { usePermissions } from '@/hooks/usePermissions';
import { RollbackResult } from '@/types/mcp';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

export const RollbackTab = () => {
  const { token } = useJWT();
  const { mcpService, isConnected } = useMCPConnection();
  const { canAccessTool } = usePermissions();
  const [formData, setFormData] = useState({
    deploymentId: '',
    reason: '',
    environment: 'staging',
  });
  const [result, setResult] = useState<RollbackResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isConnected) return;

    setIsLoading(true);
    setError(null);
    setIsAuthError(false);
    setResult(null);

    try {
      const response = await mcpService.rollbackDeployment(
        token,
        formData.deploymentId,
        formData.reason,
        formData.environment
      );

      if (response.success) {
        // MCP tools return data in response.data.result structure
        const toolResponse = response.data as unknown as Record<string, unknown>;
        if (toolResponse?.success && toolResponse?.result) {
          setResult(toolResponse.result as RollbackResult);
        } else {
          setError((toolResponse?.error as string) || 'Rollback failed');
          setIsAuthError(false);
        }
      } else {
        setError(response.error || 'Rollback failed');
        setIsAuthError(response.isAuthError || false);
      }
    } catch {
      setError('Rollback failed');
      setIsAuthError(false);
    } finally {
      setIsLoading(false);
    }
  };

  const canRollbackToEnvironment = (env: string) => {
    return canAccessTool(env === 'production' ? 'rollback_production' : 'rollback_staging');
  };

  if (!isClient) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">Rollback Deployment</h3>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Rollback Deployment</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Deployment ID
          </label>
          <input
            type="text"
            value={formData.deploymentId}
            onChange={(e) => setFormData({ ...formData, deploymentId: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="deploy-123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Environment
          </label>
          <select
            value={formData.environment}
            onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="staging" disabled={!canRollbackToEnvironment('staging')}>
              Staging {!canRollbackToEnvironment('staging') && '(No Permission)'}
            </option>
            <option value="production" disabled={!canRollbackToEnvironment('production')}>
              Production {!canRollbackToEnvironment('production') && '(No Permission)'}
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Critical bug found in production"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !canRollbackToEnvironment(formData.environment) || !isConnected}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Rolling back...' : !isConnected ? 'MCP Server Offline' : `Rollback ${formData.environment === 'production' ? 'Production' : 'Staging'} Deployment`}
        </button>
      </form>

      <ErrorDisplay 
        error={error} 
        onRetry={() => handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>)}
        className="mb-4"
      />

      {result && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h4 className="font-semibold">Rollback Initiated</h4>
          <p>Deployment ID: {result.deployment_id}</p>
          <p>Reason: {result.reason}</p>
          <p>Status: {result.status}</p>
          <p>Time: {result.timestamp}</p>
        </div>
      )}
    </div>
  );
};
