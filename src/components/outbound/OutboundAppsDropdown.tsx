'use client';

import { useState } from 'react';
import GitLabConnectModal from './GitLabConnectModal';

interface OutboundApp {
  id: string;
  name: string;
  icon: string;
  description: string;
  isConnected: boolean;
}

export default function OutboundAppsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGitLabModal, setShowGitLabModal] = useState(false);
  const [gitLabConnected, setGitLabConnected] = useState(false);

  // Only GitLab app for now
  const apps: OutboundApp[] = [
    {
      id: 'gitlab',
      name: 'GitLab',
      icon: '🦊',
      description: 'Connect to GitLab for repository management',
      isConnected: gitLabConnected
    }
  ];

  const handleConnect = (appId: string) => {
    if (appId === 'gitlab') {
      setShowGitLabModal(true);
    }
  };

  const handleGitLabSuccess = () => {
    setGitLabConnected(true);
    setShowGitLabModal(false);
  };

  const handleGitLabClose = () => {
    setShowGitLabModal(false);
  };

  const connectedCount = apps.filter(app => app.isConnected).length;
  const totalCount = apps.length;

  return (
    <>
      <div className="relative">
        {/* Dropdown Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span>🔗</span>
          <span>Outbound Apps</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {connectedCount}/{totalCount}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Available Apps
              </div>
              
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{app.icon}</span>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{app.name}</div>
                      <div className="text-xs text-gray-500">{app.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {app.isConnected ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <span className="text-xs">✅</span>
                        <span className="text-xs font-medium">Connected</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(app.id)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GitLab Connect Modal */}
      {showGitLabModal && (
        <GitLabConnectModal
          onSuccess={handleGitLabSuccess}
          onClose={handleGitLabClose}
        />
      )}
    </>
  );
}
