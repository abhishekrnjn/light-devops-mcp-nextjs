'use client';

import { useState, useEffect } from 'react';
import { useJWT } from '@/hooks/useJWT';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { usePermissions } from '@/hooks/usePermissions';
import { DeploymentResult } from '@/types/mcp';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

export const DeployTab = () => {
  const { token } = useJWT();
  const { mcpService, isConnected } = useMCPConnection();
  const { canAccessTool } = usePermissions();
  const [formData, setFormData] = useState({
    serviceName: '',
    version: '',
    environment: 'staging',
  });
  const [result, setResult] = useState<DeploymentResult | null>(null);
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
      const response = await mcpService.deployService(
        token,
        formData.serviceName,
        formData.version,
        formData.environment
      );

      if (response.success) {
        setResult(response.data!);
      } else {
        setError(response.error || 'Deployment failed');
        setIsAuthError(response.isAuthError || false);
      }
    } catch {
      setError('Deployment failed');
      setIsAuthError(false);
    } finally {
      setIsLoading(false);
    }
  };

  const canDeployToEnvironment = (env: string) => {
    return canAccessTool('deploy_service', env);
  };

  if (!isClient) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">Deploy Service</h3>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Deploy Service</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Service Name
          </label>
          <input
            type="text"
            value={formData.serviceName}
            onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="my-service"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Version
          </label>
          <input
            type="text"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="1.0.0"
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
            <option value="staging" disabled={!canDeployToEnvironment('staging')}>
              Staging {!canDeployToEnvironment('staging') && '(No Permission)'}
            </option>
            <option value="production" disabled={!canDeployToEnvironment('production')}>
              Production {!canDeployToEnvironment('production') && '(No Permission)'}
            </option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading || !canDeployToEnvironment(formData.environment) || !isConnected}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Deploying...' : !isConnected ? 'MCP Server Offline' : 'Deploy Service'}
        </button>
      </form>

      <ErrorDisplay 
        error={error} 
        onRetry={() => handleSubmit(new Event('submit') as any)}
        className="mb-4"
      />

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h4 className="font-semibold">Deployment Successful!</h4>
          <p>Service: {result.service_name}</p>
          <p>Version: {result.version}</p>
          <p>Environment: {result.environment}</p>
          <p>Status: {result.status}</p>
          <p>Time: {result.timestamp}</p>
        </div>
      )}
    </div>
  );
};
