'use client';

import { useState, useEffect } from 'react';
import { useJWT } from '@/hooks/useJWT';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { usePermissions } from '@/hooks/usePermissions';
import { useOutboundConnection } from '@/hooks/useOutboundConnection';
import { DeploymentResult, EnhancedDeploymentResponse } from '@/types/mcp';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

export const DeployTab = () => {
  const { token } = useJWT();
  const { mcpService, isConnected } = useMCPConnection();
  const { canAccessTool } = usePermissions();
  const { hasAnyConnection, isConnected: isOutboundConnected } = useOutboundConnection();
  const [formData, setFormData] = useState({
    serviceName: '',
    version: '',
    environment: 'staging',
  });

  // Dummy service names for dropdown
  const serviceOptions = [
    'user-service',
    'payment-service', 
    'auth-service',
    'notification-service',
    'api-gateway',
    'database-service',
    'cache-service',
    'analytics-service',
    'monitoring-service',
    'test-service',
    'critical-service',
    'experimental-service'
  ];
  const [result, setResult] = useState<EnhancedDeploymentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isConnected || !hasAnyConnection) return;

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

      if (response.success && response.data) {
        // Handle enhanced response structure
        setResult(response.data);
        console.log('✅ Deployment successful:', response.data);
      } else {
        setError(response.error || 'Deployment failed');
        setIsAuthError(response.isAuthError || false);
      }
    } catch (error) {
      console.error('❌ Deployment error:', error);
      setError('Deployment failed');
      setIsAuthError(false);
    } finally {
      setIsLoading(false);
    }
  };

  const canDeployToEnvironment = (env: string) => {
    return canAccessTool('deploy_service', env);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Deploy Service</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Service Name
          </label>
          <select
            value={formData.serviceName}
            onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a service...</option>
            {serviceOptions.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
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
            placeholder="1.0.0, v2.1.3, 3.0.0-beta, etc."
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
          disabled={isLoading || !canDeployToEnvironment(formData.environment) || !isConnected || !hasAnyConnection}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading 
            ? 'Deploying...' 
            : !isConnected 
              ? 'MCP Server Offline' 
              : !hasAnyConnection 
                ? 'Outbound App Required' 
                : 'Deploy Service'
          }
        </button>
      </form>

      {!hasAnyConnection && (
        <div className="px-4 py-3 rounded border bg-yellow-100 border-yellow-400 text-yellow-700">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <div>
              <h4 className="font-semibold">Outbound App Connection Required</h4>
              <p className="text-sm mt-1">
                You need to connect to an outbound app (like GitLab) before you can deploy services. 
                Please go to the Connections tab and connect to an outbound app first.
              </p>
            </div>
          </div>
        </div>
      )}

      <ErrorDisplay 
        error={error} 
        onRetry={() => handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>)}
        className="mb-4"
      />

      {result && result.deployment && (
        <div className={`px-4 py-3 rounded border ${
          result.success 
            ? result.deployment.status === 'SUCCESS' 
              ? 'bg-green-100 border-green-400 text-green-700'
              : result.deployment.status === 'IN_PROGRESS'
              ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
              : 'bg-red-100 border-red-400 text-red-700'
            : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          <h4 className="font-semibold">
            {result.success 
              ? result.deployment.status === 'SUCCESS' 
                ? '✅ Deployment Successful!'
                : result.deployment.status === 'IN_PROGRESS'
                ? '⏳ Deployment In Progress...'
                : '❌ Deployment Failed'
              : '❌ Deployment Failed'
            }
          </h4>
          <div className="mt-2 space-y-1">
            <p><strong>Service:</strong> {result.deployment.service_name}</p>
            <p><strong>Version:</strong> {result.deployment.version}</p>
            <p><strong>Environment:</strong> {result.deployment.environment}</p>
            <p><strong>Status:</strong> {result.deployment.status}</p>
            <p><strong>Deployment ID:</strong> {result.deployment.deployment_id}</p>
            <p><strong>Service Type:</strong> {result.metadata?.service_type || 'N/A'}</p>
            <p><strong>Time:</strong> {new Date(result.deployment.timestamp).toLocaleString()}</p>
            <p className="text-sm mt-2"><strong>Message:</strong> {result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
