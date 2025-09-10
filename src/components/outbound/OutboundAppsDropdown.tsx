'use client';

import { useState, useEffect, useRef } from 'react';
import { useOutboundConnection } from '@/hooks/useOutboundConnection';

interface OutboundApp {
  id: string;
  name: string;
  icon: string;
  description: string;
  isConnected: boolean;
}

interface OutboundAppsDropdownProps {
  isCollapsed?: boolean;
}

export default function OutboundAppsDropdown({ isCollapsed = false }: OutboundAppsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { addConnection, isConnected } = useOutboundConnection();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Only GitLab app for now
  const apps: OutboundApp[] = [
    {
      id: 'github11', // Use the same ID as in OutboundConnectionCard
      name: 'GitLab',
      icon: '🦊',
      description: 'Connect to GitLab for repository management',
      isConnected: isConnected('github11')
    }
  ];

  const handleConnect = async (appId: string) => {
    if (appId === 'github11') {
      setIsConnecting(true);
      
      try {
        // Simulate connection process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Add connection to context
        addConnection({
          id: `${appId}-connection`,
          providerId: appId,
          providerName: 'GitLab',
          status: 'connected',
          connectedAt: new Date(),
          scopes: ['read_user', 'read_api', 'read_repository', 'write_repository']
        });
      } catch (error) {
        console.error('Connection failed:', error);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const connectedCount = apps.filter(app => app.isConnected).length;
  const totalCount = apps.length;

  // When collapsed, show only an icon button
  if (isCollapsed) {
    return (
      <div ref={dropdownRef} className="relative w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Outbound Apps"
        >
          <span className="text-xl">🔗</span>
        </button>

        {/* Dropdown Menu for collapsed state */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Available Apps
              </div>
              
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="text-lg flex-shrink-0">{app.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-900 truncate">{app.name}</div>
                      <div className="text-xs text-gray-500 truncate">{app.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {app.isConnected ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <span className="text-xs">✅</span>
                        <span className="text-xs font-medium">Connected</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(app.id)}
                        disabled={isConnecting}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // When expanded, show full dropdown
  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          <span>🔗</span>
          <span>Outbound Apps</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {connectedCount}/{totalCount}
          </span>
        </div>
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Available Apps
            </div>
            
            {apps.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span className="text-lg flex-shrink-0">{app.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-900 truncate">{app.name}</div>
                    <div className="text-xs text-gray-500 truncate">{app.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {app.isConnected ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <span className="text-xs">✅</span>
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(app.id)}
                      disabled={isConnecting}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

