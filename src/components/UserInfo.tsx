'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, logoutUser, UserInfo as UserInfoType } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User, Shield, LogOut, RefreshCw } from 'lucide-react';

export default function UserInfo() {
  const { user: authUser, isAuthenticated } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      // First try to use data from AuthContext (localStorage)
      if (authUser && isAuthenticated) {
        console.log('📦 Using user data from AuthContext:', authUser);
        
        // Convert the auth user data to the expected format
        const convertedUserInfo: UserInfoType = {
          user_id: authUser.userId || 'unknown',
          name: authUser.name || 'User',
          email: authUser.email || '',
          login_id: authUser.email || '',
          tenant: (authUser as any).tenant || 'default',
          roles: (authUser as any).roles || [],
          permissions: (authUser as any).permissions || [],
          scopes: (authUser as any).scopes || []
        };
        
        console.log('✅ Converted user info:', convertedUserInfo);
        setUserInfo(convertedUserInfo);
        setLoading(false);
        return;
      }

      // Fallback to API call if no auth data
      console.log('🔄 No auth data available, trying API call...');
      const info = await getCurrentUser();
      setUserInfo(info);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [authUser, isAuthenticated]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'observer':
        return 'bg-blue-100 text-blue-800';
      case 'developer':
        return 'bg-green-100 text-green-800';
      case 'developer_prod_access':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionBadgeColor = (permission: string) => {
    if (permission.includes('read')) return 'bg-blue-50 text-blue-700';
    if (permission.includes('deploy')) return 'bg-orange-50 text-orange-700';
    if (permission.includes('rollback')) return 'bg-red-50 text-red-700';
    return 'bg-gray-50 text-gray-700';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm text-gray-600">Loading user information...</span>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-4">Unable to load user information</p>
          <button
            onClick={fetchUserInfo}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchUserInfo}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Refresh user info"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50"
            >
              <LogOut className="w-3 h-3" />
              <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2 font-medium">{userInfo.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 font-medium">{userInfo.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">User ID:</span>
              <span className="ml-2 font-mono text-xs">{userInfo.user_id}</span>
            </div>
            <div>
              <span className="text-gray-500">Tenant:</span>
              <span className="ml-2 font-medium">{userInfo.tenant || 'N/A'}</span>
            </div>
          </div>

          {/* Roles */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Roles</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {userInfo.roles.length > 0 ? (
                userInfo.roles.map((role, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(role)}`}
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">No roles assigned</span>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Permissions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {userInfo.permissions.length > 0 ? (
                userInfo.permissions.map((permission, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 text-xs font-medium rounded ${getPermissionBadgeColor(permission)}`}
                  >
                    {permission.replace('_', ' ')}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">No permissions assigned</span>
              )}
            </div>
          </div>

          {/* Permission Summary */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Access Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>View Logs:</span>
                <span className={userInfo.permissions.includes('read_logs') ? 'text-green-600' : 'text-red-600'}>
                  {userInfo.permissions.includes('read_logs') ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>View Metrics:</span>
                <span className={userInfo.permissions.includes('read_metric') ? 'text-green-600' : 'text-red-600'}>
                  {userInfo.permissions.includes('read_metric') ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Deploy Staging:</span>
                <span className={userInfo.permissions.includes('deploy_staging') ? 'text-green-600' : 'text-red-600'}>
                  {userInfo.permissions.includes('deploy_staging') ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Deploy Production:</span>
                <span className={userInfo.permissions.includes('deploy_production') ? 'text-green-600' : 'text-red-600'}>
                  {userInfo.permissions.includes('deploy_production') ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between col-span-2">
                <span>Rollback:</span>
                <span className={userInfo.permissions.includes('rollback.write') ? 'text-green-600' : 'text-red-600'}>
                  {userInfo.permissions.includes('rollback.write') ? '✅' : '❌'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
