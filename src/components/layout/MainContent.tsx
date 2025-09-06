'use client';

import { LogsTab } from '@/components/dashboard/LogsTab';
import { MetricsTab } from '@/components/dashboard/MetricsTab';
import { DeployTab } from '@/components/dashboard/DeployTab';
import { RollbackTab } from '@/components/dashboard/RollbackTab';
import { AITab } from '@/components/dashboard/AITab';

interface MainContentProps {
  activeTab: string;
  user: {
    name?: string;
    email?: string;
    userId?: string;
  } | null;
  onLogout: () => void;
  onMobileMenuToggle?: () => void;
}

export const MainContent = ({ activeTab, user, onLogout, onMobileMenuToggle }: MainContentProps) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'logs':
        return <LogsTab />;
      case 'metrics':
        return <MetricsTab />;
      case 'deploy':
        return <DeployTab />;
      case 'rollback':
        return <RollbackTab />;
      case 'ai':
        return <AITab />;
      default:
        return <OverviewTab />;
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
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {activeTab === 'overview' ? 'Dashboard Overview' : activeTab}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {getTabDescription(activeTab)}
                </p>
              </div>
            </div>
            
            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || user?.email || 'User'}
                </div>
                <div className="text-xs text-gray-500">
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

const OverviewTab = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="text-6xl">🚀</div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to DevOps Dashboard</h1>
            <p className="text-blue-100 text-lg">
              Manage your infrastructure with powerful tools and AI assistance
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="System Health"
          value="99.9%"
          icon="💚"
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Active Services"
          value="12"
          icon="⚙️"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Deployments"
          value="47"
          icon="🚀"
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard
          title="AI Queries"
          value="156"
          icon="🤖"
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <ActivityItem
            icon="🚀"
            title="Service deployed"
            description="user-service v2.1.0 to production"
            time="2 minutes ago"
            status="success"
          />
          <ActivityItem
            icon="📊"
            title="Metrics updated"
            description="CPU usage: 45%, Memory: 67%"
            time="5 minutes ago"
            status="info"
          />
          <ActivityItem
            icon="🤖"
            title="AI query processed"
            description="Analyzed deployment logs"
            time="8 minutes ago"
            status="info"
          />
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
        <p className="text-sm font-medium text-gray-600">{title}</p>
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
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
        <p className={`text-xs ${statusColors[status]} mt-1`}>{time}</p>
      </div>
    </div>
  );
};

const getTabDescription = (tab: string): string => {
  const descriptions: Record<string, string> = {
    overview: 'Monitor your system health and recent activity',
    logs: 'View and analyze system logs in real-time',
    metrics: 'Track performance metrics and system statistics',
    deploy: 'Deploy new versions of your services',
    rollback: 'Rollback deployments to previous versions',
    ai: 'Get AI-powered assistance for your operations',
  };
  return descriptions[tab] || 'Manage your DevOps operations';
};
