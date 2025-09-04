'use client';

import { useState, useEffect } from 'react';
import { fetchApiData, checkHealth, getCurrentUser, hasPermission, LogEntry, Metric, Deployment, Rollback, UserInfo } from '@/lib/api';
import { Activity, AlertCircle, CheckCircle, Clock, RefreshCw, Server, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import UserInfoComponent from './UserInfo';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [rollbacks, setRollbacks] = useState<Rollback[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [tokenPreview, setTokenPreview] = useState('Loading...');
  const [hasToken, setHasToken] = useState(false);

  // Helper function to get token preview for debugging
  const getTokenPreview = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (!userData) return 'No user data';
      const parsed = JSON.parse(userData);
      const token = parsed.sessionToken;
      if (!token) return 'No token in user data';
      return token.substring(0, 20) + '...';
    } catch {
      return 'Error reading token';
    }
  };

  // Fetch user info
  const fetchUserInfo = async () => {
    setUserLoading(true);
    try {
      // Check if we have a token first
      const userData = localStorage.getItem('user_data');
      if (!userData) {
        console.log('❌ No user data in localStorage, skipping user info fetch');
        setUserInfo(null);
        setUserLoading(false);
        return;
      }

      const info = await getCurrentUser();
      setUserInfo(info);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserInfo(null);
    } finally {
      setUserLoading(false);
    }
  };

  // Update token preview and user info after mount
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    const hasUserData = !!userData;
    setHasToken(hasUserData);
    setTokenPreview(getTokenPreview());
    
    // Only fetch user info if we have user data
    if (hasUserData) {
      fetchUserInfo();
    } else {
      console.log('❌ No user data found, user needs to log in');
      setUserLoading(false);
      setUserInfo(null);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data from backend...');
      
      // Only fetch data the user has permission to see
      const promises: Promise<any>[] = [checkHealth()];
      
      if (hasPermission(userInfo, 'read_logs')) {
        promises.push(fetchApiData<LogEntry>('api/v1/logs'));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      if (hasPermission(userInfo, 'read_metric')) {
        promises.push(fetchApiData<Metric>('api/v1/metrics'));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      if (hasPermission(userInfo, 'read_deployments')) { // Deployments require specific permission
        promises.push(fetchApiData<Deployment>('api/v1/deployments'));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      if (hasPermission(userInfo, 'read_rollbacks')) { // Rollbacks require specific permission
        promises.push(fetchApiData<Rollback>('api/v1/rollbacks'));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      const [healthStatus, logsData, metricsData, deploymentsData, rollbacksData] = await Promise.all(promises);

      console.log('Backend responses:', {
        healthStatus,
        logsCount: logsData.length,
        metricsCount: metricsData.length,
        deploymentsCount: deploymentsData.length,
        rollbacksCount: rollbacksData.length
      });

      setIsHealthy(healthStatus);
      setLogs(logsData);
      setMetrics(metricsData);
      setDeployments(deploymentsData);
      setRollbacks(rollbacksData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data after user loading is complete, regardless of success/failure
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading]);

  useEffect(() => {
    if (autoRefresh && hasToken && !userLoading) {
      const interval = setInterval(fetchData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, hasToken, userLoading]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return '🔴';
      case 'WARNING':
        return '🟡';
      case 'INFO':
        return '🟢';
      default:
        return '⚪';
    }
  };

  // Filter tabs based on user permissions
  const getAvailableTabs = () => {
    const allTabs = [
      { id: 'overview', label: '📊 Overview', icon: Activity, permission: null },
      { id: 'user', label: '👤 Profile', icon: User, permission: null },
      { id: 'logs', label: '📝 Logs', icon: Server, permission: 'read_logs' },
      { id: 'metrics', label: '📊 Metrics', icon: Activity, permission: 'read_metric' },
      { id: 'deployments', label: '🚀 Deployments', icon: Server, permission: 'read_deployments' },
      { id: 'rollbacks', label: '🔄 Rollbacks', icon: RefreshCw, permission: 'read_rollbacks' },
    ];
    
    return allTabs.filter(tab => 
      tab.permission === null || hasPermission(userInfo, tab.permission)
    );
  };
  
  const tabs = getAvailableTabs();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Controls */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>Auto-refresh (30s)</span>
            </label>
            
            <button
              onClick={() => {
                localStorage.removeItem('user_data');
                window.location.reload();
              }}
              className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Re-login (Debug)
            </button>
          </div>
        </div>
        
        {/* RBAC Status */}
        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-4">
          <div className="font-medium mb-1">🔐 RBAC Status:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>Backend: {isHealthy === null ? 'Checking...' : isHealthy ? '✅ Connected' : '❌ Disconnected'}</div>
          <div>JWT Token: {hasToken ? '✅ Present' : '❌ Missing'}</div>
            <div>User Info: {userLoading ? '⏳ Loading...' : userInfo ? '✅ Loaded' : '❌ Failed'}</div>
            <div>Permissions: {userInfo ? `${userInfo.permissions.length} active` : 'N/A'}</div>
          </div>
          {userInfo && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <div className="font-medium">Quick Access Summary:</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                <div>Logs: {hasPermission(userInfo, 'read_logs') ? '✅' : '❌'}</div>
                <div>Metrics: {hasPermission(userInfo, 'read_metric') ? '✅' : '❌'}</div>
                <div>View Deployments: {hasPermission(userInfo, 'read_deployments') ? '✅' : '❌'}</div>
                <div>View Rollbacks: {hasPermission(userInfo, 'read_rollbacks') ? '✅' : '❌'}</div>
                <div>Deploy: {hasPermission(userInfo, 'deploy_staging') || hasPermission(userInfo, 'deploy_production') ? '✅' : '❌'}</div>
                <div>Rollback: {hasPermission(userInfo, 'rollback.write') ? '✅' : '❌'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Info (Collapsed) */}
        <details className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 mb-4">
          <summary className="cursor-pointer font-medium">🔧 Debug Info (Click to expand)</summary>
          <div className="mt-2 space-y-1">
            <div>API Base URL: http://localhost:8000</div>
            <div>Token Preview: {tokenPreview}</div>
            <div>Data Counts: Logs({logs.length}), Metrics({metrics.length}), Deployments({deployments.length}), Rollbacks({rollbacks.length})</div>
            <div className="text-yellow-700">Check browser console (F12) for detailed API logs</div>
          </div>
        </details>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'user' && (
          <UserInfoComponent />
        )}
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Metrics</span>
                  <span className="font-semibold">{metrics.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Recent Deployments</span>
                  <span className="font-semibold">{deployments.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
              <div className="flex items-center space-x-2">
                {isHealthy === null ? (
                  <Clock className="w-5 h-5 text-gray-400" />
                ) : isHealthy ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`font-medium ${
                  isHealthy === null ? 'text-gray-500' : isHealthy ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isHealthy === null ? 'Checking...' : isHealthy ? 'Backend API Online' : 'Backend API Offline'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
              {!hasPermission(userInfo, 'read_logs') && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <Shield className="w-4 h-4 inline mr-1" />
                  You don't have permission to view logs. Contact your administrator to get the 'read_logs' permission.
                </div>
              )}
            </div>
            <div className="p-6">
              {!hasPermission(userInfo, 'read_logs') ? (
                <p className="text-gray-500 text-center py-8">Access denied - insufficient permissions</p>
              ) : logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded">
                      <span className="text-lg">{getLevelIcon(log.level)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{log.level}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mt-1">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No logs available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">System Metrics</h3>
              {!hasPermission(userInfo, 'read_metric') && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <Shield className="w-4 h-4 inline mr-1" />
                  You don't have permission to view metrics. Contact your administrator to get the 'read_metric' permission.
                </div>
              )}
            </div>
            <div className="p-6">
              {!hasPermission(userInfo, 'read_metric') ? (
                <p className="text-gray-500 text-center py-8">Access denied - insufficient permissions</p>
              ) : metrics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.map((metric, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">
                        {metric.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {metric.value} {metric.unit}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No metrics available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'deployments' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Deployments</h3>
              {!hasPermission(userInfo, 'read_deployments') && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <Shield className="w-4 h-4 inline mr-1" />
                  You don't have permission to view deployments. Contact your administrator to get the 'read_deployments' permission.
                </div>
              )}
            </div>
            <div className="p-6">
              {!hasPermission(userInfo, 'read_deployments') ? (
                <p className="text-gray-500 text-center py-8">Access denied - insufficient permissions</p>
              ) : deployments.length > 0 ? (
                <div className="space-y-3">
                  {deployments.map((deployment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {deployment.service_name} v{deployment.version}
                        </div>
                        <div className="text-sm text-gray-500">{deployment.environment}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(deployment.status)}
                          <span className="text-sm">{deployment.status}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(deployment.timestamp), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No deployments available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rollbacks' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Rollbacks</h3>
              {!hasPermission(userInfo, 'read_rollbacks') && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <Shield className="w-4 h-4 inline mr-1" />
                  You don't have permission to view rollbacks. Contact your administrator to get the 'read_rollbacks' permission.
                </div>
              )}
            </div>
            <div className="p-6">
              {!hasPermission(userInfo, 'read_rollbacks') ? (
                <p className="text-gray-500 text-center py-8">Access denied - insufficient permissions</p>
              ) : rollbacks.length > 0 ? (
                <div className="space-y-3">
                  {rollbacks.map((rollback, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Reason: {rollback.reason}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(rollback.status)}
                          <span className="text-sm">{rollback.status}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(rollback.timestamp), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No rollbacks available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
