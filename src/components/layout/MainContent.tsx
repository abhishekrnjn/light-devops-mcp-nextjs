'use client';

import { LogsTab } from '@/components/dashboard/LogsTab';
import { MetricsTab } from '@/components/dashboard/MetricsTab';
import { DeployTab } from '@/components/dashboard/DeployTab';
import { RollbackTab } from '@/components/dashboard/RollbackTab';
import { AITab } from '@/components/dashboard/AITab';
import { useJWT } from '@/hooks/useJWT';
import { usePermissions } from '@/hooks/usePermissions';
import { useState, useEffect } from 'react';
import { SkeletonCard, SkeletonTable } from '@/components/common/SkeletonLoader';
import { MCPResource, MCPTool } from '@/types/mcp';

interface MainContentProps {
  activeTab: string;
  user: {
    name?: string;
    email?: string;
    userId?: string;
  } | null;
  onLogout: () => void;
  onMobileMenuToggle?: () => void;
  onRefreshConnection?: () => void;
  isLoading?: boolean;
  isMCPLoading?: boolean;
  mcpError?: string | null;
  isConnected?: boolean;
  resources?: MCPResource[];
  tools?: MCPTool[];
}

export const MainContent = ({ 
  activeTab, 
  user, 
  onLogout, 
  onMobileMenuToggle, 
  onRefreshConnection, 
  isLoading,
  isMCPLoading = false,
  mcpError: propMCPError,
  isConnected: propIsConnected,
  resources = [],
  tools = []
}: MainContentProps) => {
  // Use props from DashboardLayout
  const isConnected = propIsConnected;
  const mcpError = propMCPError;
  
  const renderMCPStatus = () => {
    if (isMCPLoading) {
      return (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Connecting to MCP server...</span>
          </div>
        </div>
      );
    }
    
    if (mcpError && !isConnected) {
      return (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm text-yellow-700">MCP server unavailable</span>
            </div>
            {onRefreshConnection && (
              <button
                onClick={onRefreshConnection}
                className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      );
    }
    
    if (isConnected) {
      return (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-700">MCP server connected</span>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  const renderTabContent = () => {
    // Show skeleton loading for MCP-dependent tabs when MCP is loading
    if (isMCPLoading && ['logs', 'metrics', 'deploy', 'rollback'].includes(activeTab)) {
      return (
        <div className="space-y-4">
          {renderMCPStatus()}
          <SkeletonTable rows={5} />
        </div>
      );
    }
    
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={user} isConnected={isConnected} />;
      case 'logs':
        return <LogsTab isConnected={isConnected} isLoading={isMCPLoading} />;
      case 'metrics':
        return <MetricsTab isConnected={isConnected} isLoading={isMCPLoading} />;
      case 'deploy':
        return <DeployTab isConnected={isConnected} />;
      case 'rollback':
        return <RollbackTab isConnected={isConnected} />;
      case 'ai':
        return <AITab isConnected={isConnected} resources={resources} tools={tools} />;
      default:
        return <OverviewTab user={user} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">☰</span>
              </button>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {activeTab === 'overview' ? 'Dashboard Overview' : activeTab === 'ai' ? 'AI' : activeTab}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {getTabDescription(activeTab)}
                </p>
              </div>
            </div>
            
            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">
                  {user?.name || user?.email || 'User'}
                </div>
                <div className="text-xs text-slate-600">
                  {user?.email && user?.name ? user.email : 'DevOps User'}
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

const OverviewTab = ({ user, isConnected }: { user: { name?: string; email?: string; userId?: string } | null; isConnected?: boolean }) => {
  const { hasPermission } = usePermissions();

  const canReadLogs = hasPermission('read_logs');
  const canReadMetrics = hasPermission('read_metrics');
  const canDeployStaging = hasPermission('deploy_staging');
  const canDeployProduction = hasPermission('deploy_production');
  const canRollbackStaging = hasPermission('rollback_staging');
  const canRollbackProduction = hasPermission('rollback_production');

  // Helper function to extract first name
  const getFirstName = () => {
    if (user?.name) {
      return user.name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0].split('.')[0];
    }
    return 'User';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="text-6xl">🚀</div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Hello {getFirstName()}</h1>
            <p className="text-blue-100 text-lg">
              Manage your infrastructure with powerful tools and AI assistance
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className="text-lg font-semibold text-slate-900">
            {isConnected ? 'MCP Server Connected' : 'MCP Server Disconnected'}
          </h3>
        </div>
        <p className="text-slate-600 mt-2">
          {isConnected 
            ? 'All systems are operational and ready for DevOps operations.' 
            : 'Unable to connect to MCP server. Please check your connection and try again.'
          }
        </p>
      </div>

      {/* Available Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logs Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">📋</span>
            <h3 className="text-lg font-semibold text-slate-900">System Logs</h3>
          </div>
          {!canReadLogs ? (
            <PermissionMessage 
              feature="logs"
              description="View recent system logs and error messages"
            />
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600">Monitor system logs in real-time to track errors, warnings, and system events.</p>
              <div className={`p-3 rounded-lg ${canReadLogs ? 'bg-green-50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${canReadLogs ? 'text-green-800' : 'text-gray-600'}`}>
                  <strong>Scopes Available:</strong> View logs, filter by level, and search through log entries.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Metrics Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">📈</span>
            <h3 className="text-lg font-semibold text-slate-900">System Metrics</h3>
          </div>
          {!canReadMetrics ? (
            <PermissionMessage 
              feature="metrics"
              description="View system performance metrics and statistics"
            />
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600">Track system performance with real-time metrics and statistics.</p>
              <div className={`p-3 rounded-lg ${canReadMetrics ? 'bg-green-50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${canReadMetrics ? 'text-green-800' : 'text-gray-600'}`}>
                  <strong>Scopes Available:</strong> CPU usage, memory consumption, response times, and more.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Deploy Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🚀</span>
            <h3 className="text-lg font-semibold text-slate-900">Deploy Services</h3>
          </div>
          {!canDeployStaging && !canDeployProduction ? (
            <PermissionMessage 
              feature="deployments"
              description="Deploy new versions of your services to staging and production"
            />
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600">Deploy new versions of your services to different environments.</p>
              <div className={`p-3 rounded-lg ${(canDeployStaging || canDeployProduction) ? 'bg-green-50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${(canDeployStaging || canDeployProduction) ? 'text-green-800' : 'text-gray-600'}`}>
                  <strong>Scopes Available:</strong> 
                  {canDeployStaging && ' Staging'}
                  {canDeployStaging && canDeployProduction && ' &'}
                  {canDeployProduction && ' Production'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rollback Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">↩️</span>
            <h3 className="text-lg font-semibold text-slate-900">Rollback Deployments</h3>
          </div>
          {!canRollbackStaging && !canRollbackProduction ? (
            <PermissionMessage 
              feature="rollbacks"
              description="Rollback deployments to previous versions when issues occur"
            />
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600">Quickly rollback deployments to previous versions when issues are detected.</p>
              <div className={`p-3 rounded-lg ${(canRollbackStaging || canRollbackProduction) ? 'bg-green-50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${(canRollbackStaging || canRollbackProduction) ? 'text-green-800' : 'text-gray-600'}`}>
                  <strong>Scopes Available:</strong> 
                  {canRollbackStaging && ' Staging'}
                  {canRollbackStaging && canRollbackProduction && ' &'}
                  {canRollbackProduction && ' Production'}
                  {' rollbacks with reason tracking.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <span className="text-2xl">🤖</span>
          <h3 className="text-lg font-semibold text-slate-900">AI Assistant</h3>
        </div>
        <div className="space-y-3 text-center">
          <p className="text-slate-600">AI-powered chatbot for monitoring and deployment operations.</p>
          <div className={`p-3 rounded-lg ${(canReadLogs || canReadMetrics || canDeployStaging || canDeployProduction || canRollbackStaging || canRollbackProduction) ? 'bg-green-50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${(canReadLogs || canReadMetrics || canDeployStaging || canDeployProduction || canRollbackStaging || canRollbackProduction) ? 'text-green-800' : 'text-gray-600'}`}>
              <strong>Scopes Available:</strong> Ask questions about
              {canReadLogs && ' logs'}
              {canReadLogs && (canReadMetrics || canDeployStaging || canDeployProduction || canRollbackStaging || canRollbackProduction) && ','}
              {canReadMetrics && ' metrics'}
              {canReadMetrics && (canDeployStaging || canDeployProduction || canRollbackStaging || canRollbackProduction) && ','}
              {(canDeployStaging || canDeployProduction) && ' deployments'}
              {(canDeployStaging || canDeployProduction) && (canRollbackStaging || canRollbackProduction) && ','}
              {(canRollbackStaging || canRollbackProduction) && ' rollbacks'}
              {(!canReadLogs && !canReadMetrics && !canDeployStaging && !canDeployProduction && !canRollbackStaging && !canRollbackProduction) && ' basic operations'}
              {' and get intelligent insights.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, bgColor }: {
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}) => (
  <div className={`${bgColor} rounded-xl p-6`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);

const ActivityItem = ({ icon, title, description, time, status }: {
  icon: string;
  title: string;
  description: string;
  time: string;
  status: 'success' | 'info' | 'warning' | 'error';
}) => {
  const statusColors = {
    success: 'text-green-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="text-xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{description}</p>
        <p className={`text-xs ${statusColors[status]} mt-1`}>{time}</p>
      </div>
    </div>
  );
};

const PermissionMessage = ({ feature, description }: { feature: string; description: string }) => (
  <div className="text-center py-8 bg-amber-50 border border-amber-200 rounded-lg">
    <div className="text-4xl mb-4">🔒</div>
    <h4 className="text-lg font-semibold text-amber-800 mb-2">Access Restricted</h4>
    <p className="text-amber-700 mb-2">
      You don&apos;t have permission to view {feature}.
    </p>
    <p className="text-sm text-amber-600">
      {description}
    </p>
    <div className="mt-4 p-3 bg-amber-100 rounded-lg">
      <p className="text-sm text-amber-800">
        <strong>Need access?</strong> Please contact your system administrator to request permission for viewing {feature}.
      </p>
    </div>
  </div>
);

const getTabDescription = (tab: string): string => {
  const descriptions: Record<string, string> = {
    overview: 'Monitor your system health and recent activity',
    logs: 'View and analyze system logs in real-time',
    metrics: 'Track performance metrics and system statistics',
    deploy: 'Deploy new versions of your services',
    rollback: 'Rollback deployments to previous versions',
    ai: 'AI-powered chatbot for monitoring and deployment operations',
  };
  return descriptions[tab] || 'Manage your DevOps operations';
};
