'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';

interface User {
  name?: string;
  email?: string;
  userId?: string;
}

interface DashboardLayoutProps {
  user: User | null;
  onLogout: () => void;
}

export const DashboardLayout = ({ user, onLogout }: DashboardLayoutProps) => {
  const { getAvailableTabs, isLoading: permissionsLoading } = usePermissions();
  const { isConnected, isLoading: mcpLoading } = useMCPConnection();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isClient, setIsClient] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const availableTabs = isClient ? getAvailableTabs() : [];
  const isLoading = !isClient || permissionsLoading || mcpLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Loading Dashboard...</h1>
          <p className="text-gray-600">Connecting to MCP server</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-600">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Connection Failed</h1>
          <p className="text-gray-600">Unable to connect to MCP server</p>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false); // Close mobile sidebar when tab changes
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      
      {/* Main Content */}
      <MainContent
        activeTab={activeTab}
        user={user}
        onLogout={onLogout}
        onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
      />
    </div>
  );
};
