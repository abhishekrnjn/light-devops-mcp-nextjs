'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useMCPConnection } from '@/hooks/useMCPConnection';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface MenuItem {
  id: string;
  name: string;
  icon: string;
  permission?: string;
  description: string;
  color: string;
}

export const Sidebar = ({ activeTab, onTabChange, isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }: SidebarProps) => {
  const { hasPermission } = usePermissions();
  const { isConnected } = useMCPConnection();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      name: 'Overview',
      icon: '📊',
      description: 'Dashboard overview',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'ai',
      name: 'AI Assistant',
      icon: '🤖',
      description: 'AI-powered assistance',
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'logs',
      name: 'Logs',
      icon: '📋',
      permission: 'read_logs',
      description: 'View system logs',
      color: 'text-green-600 bg-green-50',
    },
    {
      id: 'metrics',
      name: 'Metrics',
      icon: '📈',
      permission: 'read_metrics',
      description: 'System metrics',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'deploy',
      name: 'Deploy',
      icon: '🚀',
      permission: 'deploy_staging',
      description: 'Deploy services',
      color: 'text-orange-600 bg-orange-50',
    },
    {
      id: 'rollback',
      name: 'Rollback',
      icon: '↩️',
      permission: 'rollback_staging',
      description: 'Rollback deployments',
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  const filteredMenuItems = isClient 
    ? menuItems.filter(item => !item.permission || hasPermission(item.permission as keyof import('@/types/permissions').UserPermissions))
    : [];

  if (!isClient) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        isMobileOpen ? 'fixed inset-y-0 left-0 z-50 lg:relative' : 'hidden lg:flex'
      }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-slate-900">DevOps MCP Agent</h1>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-slate-700 hover:text-slate-900"
          >
            <span className="text-lg">
              {isCollapsed ? '→' : '←'}
            </span>
          </button>
        </div>
        
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeTab === item.id
                ? `${item.color} shadow-sm`
                : 'text-slate-700 hover:bg-gray-50 hover:text-slate-900'
            }`}
            title={isCollapsed ? item.description : undefined}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            )}
            {activeTab === item.id && !isCollapsed && (
              <div className="w-1 h-6 bg-current rounded-full"></div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="text-xs text-slate-600 text-center">
            <p>Powered by MCP</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        )}
      </div>
      </div>
    </>
  );
};
