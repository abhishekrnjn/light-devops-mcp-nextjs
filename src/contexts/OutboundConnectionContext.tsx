'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { OutboundConnection } from '@/services/outboundService';

interface OutboundConnectionContextType {
  connections: OutboundConnection[];
  addConnection: (connection: OutboundConnection) => void;
  removeConnection: (connectionId: string) => void;
  updateConnection: (connectionId: string, updates: Partial<OutboundConnection>) => void;
  hasAnyConnection: boolean;
  isConnected: (providerId: string) => boolean;
}

const OutboundConnectionContext = createContext<OutboundConnectionContextType | undefined>(undefined);

export const useOutboundConnectionContext = () => {
  const context = useContext(OutboundConnectionContext);
  if (!context) {
    throw new Error('useOutboundConnectionContext must be used within an OutboundConnectionProvider');
  }
  return context;
};

export const OutboundConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connections, setConnections] = useState<OutboundConnection[]>([]);

  const addConnection = useCallback((connection: OutboundConnection) => {
    setConnections(prev => {
      // Remove any existing connection with the same providerId
      const filtered = prev.filter(conn => conn.providerId !== connection.providerId);
      return [...filtered, connection];
    });
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  const updateConnection = useCallback((connectionId: string, updates: Partial<OutboundConnection>) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId ? { ...conn, ...updates } : conn
      )
    );
  }, []);

  const hasAnyConnection = connections.some(conn => conn.status === 'connected');

  const isConnected = useCallback((providerId: string) => {
    return connections.some(conn => 
      conn.providerId === providerId && conn.status === 'connected'
    );
  }, [connections]);

  const value: OutboundConnectionContextType = {
    connections,
    addConnection,
    removeConnection,
    updateConnection,
    hasAnyConnection,
    isConnected,
  };

  return (
    <OutboundConnectionContext.Provider value={value}>
      {children}
    </OutboundConnectionContext.Provider>
  );
};
