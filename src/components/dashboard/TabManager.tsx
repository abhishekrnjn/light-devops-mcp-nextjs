'use client';

import { useEffect, useState } from 'react';
import { LogsTab } from './LogsTab';
import { MetricsTab } from './MetricsTab';
import { DeployTab } from './DeployTab';
import { RollbackTab } from './RollbackTab';
import { AITab } from './AITab';

interface TabManagerProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabManager = ({ tabs, activeTab, onTabChange }: TabManagerProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const renderTabContent = () => {
    if (!isClient) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading...</h2>
          <p className="text-slate-600">Please wait</p>
        </div>
      );
    }

    switch (activeTab) {
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
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to DevOps Dashboard</h2>
            <p className="text-slate-600">Select a tab to get started</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};
