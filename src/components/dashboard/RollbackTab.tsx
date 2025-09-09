'use client';

import { useState, useEffect } from 'react';
import { useJWT } from '@/hooks/useJWT';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { usePermissions } from '@/hooks/usePermissions';
import { useOutboundConnection } from '@/hooks/useOutboundConnection';
import { EnhancedRollbackResponse } from '@/types/mcp';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

export const RollbackTab = () => {
  const { token } = useJWT();
  const { mcpService, isConnected } = useMCPConnection();
  const { canAccessTool } = usePermissions();
  const { hasAnyConnection } = useOutboundConnection();
  const [formData, setFormData] = useState({
    deploymentId: '',
    reason: '',
    environment: 'staging',
  });

  // Dummy deployment IDs for testing
  const deploymentOptions = [
    'deploy-123',
    'deploy-456', 
    'deploy-789',
    'deploy-abc',
    'deploy-xyz',
    'deploy-001',
    'deploy-002',
    'deploy-003'
  ];

  // Common rollback reasons
  const commonReasons = [
    'Critical bug found in production',
    'Performance degradation detected',
    'Security vulnerability discovered',
    'Database connection issues',
    'Memory leak identified',
    'API endpoint returning errors',
    'Configuration error',
    'Test rollback for validation'
  ];
  const [result, setResult] = useState<EnhancedRollbackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setResult(null);

    try {
      const response = await mcpService.rollbackDeployment(
        token,
        formData.deploymentId,
        formData.reason,
        formData.environment
      );

      if (response.success && response.data) {
        // Handle enhanced response structure
        setResult(response.data);
        console.log('✅ Rollback successful:', response.data);
      } else {
        setError(response.error || 'Rollback failed');
      }
    } catch (error) {
      console.error('❌ Rollback error:', error);
      setError('Rollback failed');
    } finally {
      setIsLoading(false);
    }
  };

  const canRollbackToEnvironment = (env: string) => {
    return canAccessTool(env === 'production' ? 'rollback_production' : 'rollback_staging');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Rollback Deployment</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Deployment ID
          </label>
          <select
            value={formData.deploymentId}
            onChange={(e) => setFormData({ ...formData, deploymentId: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a deployment...</option>
            {deploymentOptions.map((deployment) => (
              <option key={deployment} value={deployment}>
                {deployment}
              </option>
            ))}
          </select>
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
          <input
            type="text"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Critical bug found in production"
            list="reason-suggestions"
          />
          <datalist id="reason-suggestions">
            {commonReasons.map((reason, index) => (
              <option key={index} value={reason} />
            ))}
          </datalist>
        </div>

        <button
          type="submit"
          disabled={isLoading || !canRollbackToEnvironment(formData.environment) || !isConnected || !hasAnyConnection}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading 
            ? 'Rolling back...' 
            : !isConnected 
              ? 'MCP Server Offline' 
              : !hasAnyConnection 
                ? 'Outbound App Required' 
                : `Rollback ${formData.environment === 'production' ? 'Production' : 'Staging'} Deployment`
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
                You need to connect to an outbound app (like GitLab) before you can rollback deployments. 
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

      {result && result.rollback && (
        <div className={`px-4 py-3 rounded border ${
          result.success 
            ? result.rollback.status === 'SUCCESS' 
              ? 'bg-green-100 border-green-400 text-green-700'
              : result.rollback.status === 'IN_PROGRESS'
              ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
              : 'bg-red-100 border-red-400 text-red-700'
            : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          <h4 className="font-semibold">
            {result.success 
              ? result.rollback.status === 'SUCCESS' 
                ? '✅ Rollback Successful!'
                : result.rollback.status === 'IN_PROGRESS'
                ? '⏳ Rollback In Progress...'
                : '❌ Rollback Failed'
              : '❌ Rollback Failed'
            }
          </h4>
          <div className="mt-2 space-y-1">
            <p><strong>Rollback ID:</strong> {result.rollback.rollback_id}</p>
            <p><strong>Deployment ID:</strong> {result.rollback.deployment_id}</p>
            <p><strong>Environment:</strong> {result.rollback.environment}</p>
            <p><strong>Status:</strong> {result.rollback.status}</p>
            <p><strong>Reason Type:</strong> {result.metadata?.reason_type || 'N/A'}</p>
            <p><strong>Time:</strong> {new Date(result.rollback.timestamp).toLocaleString()}</p>
            <p className="text-sm mt-2"><strong>Reason:</strong> {result.rollback.reason}</p>
            <p className="text-sm"><strong>Message:</strong> {result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
