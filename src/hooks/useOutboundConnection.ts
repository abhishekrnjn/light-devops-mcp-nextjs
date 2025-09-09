'use client';

import { useOutboundConnectionContext } from '@/contexts/OutboundConnectionContext';

export const useOutboundConnection = () => {
  const context = useOutboundConnectionContext();
  
  return {
    connections: context.connections,
    isLoading: false, // Context manages state, no loading needed
    error: null, // Error handling can be added to context if needed
    isConnected: context.isConnected,
    hasAnyConnection: context.hasAnyConnection,
    addConnection: context.addConnection,
    removeConnection: context.removeConnection,
    updateConnection: context.updateConnection,
  };
};
