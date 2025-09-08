'use client';

import { useState, useEffect } from 'react';
import { useDescope } from '@descope/nextjs-sdk/client';
import { OutboundAppConfig, OutboundConnection } from '@/services/outboundService';
import GitLabConnectModal from './GitLabConnectModal';

interface OutboundConnectionCardProps {
  app: OutboundAppConfig;
  isCollapsed: boolean;
}

export const OutboundConnectionCard = ({ app, isCollapsed }: OutboundConnectionCardProps) => {
  const descope = useDescope();
  const [connection, setConnection] = useState<OutboundConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGitLabModal, setShowGitLabModal] = useState(false);

  useEffect(() => {
    if (descope) {
      loadConnectionStatus();
    }
  }, [descope, app.id]);

  const loadConnectionStatus = async () => {
    // For now, we'll assume no connection until we can properly check
    // This will be updated when the connection is established
    setConnection(null);
    setError(null);
  };

  const handleConnect = () => {
    if (!descope) return;
    
    setError(null);
    setShowGitLabModal(true);
  };

  const handleGitLabSuccess = () => {
    console.log('GitLab step-up authentication successful!');
    setConnection({
      id: 'gitlab-connection',
      providerId: app.id,
      providerName: app.name,
      status: 'connected',
      connectedAt: new Date(),
      scopes: app.scopes
    });
    setShowGitLabModal(false);
  };

  const handleGitLabClose = () => {
    setShowGitLabModal(false);
  };

  const handleDisconnect = async () => {
    // For now, we'll just show a message that disconnect is not available
    setError('Disconnect functionality not yet implemented');
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600 bg-red-50';
    if (connection?.status === 'connected') return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isConnecting) return 'Connecting...';
    if (isDisconnecting) return 'Disconnecting...';
    if (connection?.status === 'connected') return 'Connected';
    return 'Not Connected';
  };

  const getStatusIcon = () => {
    if (error) return '❌';
    if (isConnecting || isDisconnecting) return '⏳';
    if (connection?.status === 'connected') return '✅';
    return '🔗';
  };

  if (isCollapsed) {
    return (
      <div className="relative group">
        <button
          onClick={connection?.status === 'connected' ? handleDisconnect : handleConnect}
          disabled={isConnecting || isDisconnecting}
          className={`w-full p-3 rounded-lg transition-all duration-200 group-hover:bg-gray-50 ${
            connection?.status === 'connected' 
              ? 'text-green-600 hover:text-green-700' 
              : 'text-gray-600 hover:text-gray-700'
          }`}
          title={`${app.name} - ${getStatusText()}`}
        >
          <span className="text-xl">{app.icon}</span>
        </button>
        
        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {app.name} - {getStatusText()}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`p-3 rounded-lg border transition-all duration-200 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{app.icon}</span>
          <div>
            <h3 className="font-medium text-sm">{app.name}</h3>
            <p className="text-xs opacity-75">{app.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs">{getStatusIcon()}</span>
          <span className="text-xs font-medium">{getStatusText()}</span>
        </div>
      </div>
      
      {connection?.status === 'connected' && connection.connectedAt && (
        <div className="text-xs opacity-75 mb-2">
          Connected: {connection.connectedAt.toLocaleDateString()}
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-600 mb-2">
          {error}
        </div>
      )}
      
      <div className="flex space-x-2">
        {connection?.status === 'connected' ? (
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        )}
        
        {connection?.status === 'connected' && (
          <button
            onClick={loadConnectionStatus}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            title="Refresh status"
          >
            🔄
          </button>
        )}
      </div>
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
};
