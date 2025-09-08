'use client';

// @ts-ignore - DescopeClient type will be available at runtime
import { DescopeClient } from '@descope/nextjs-sdk/client';

export interface OutboundConnection {
  id: string;
  providerId: string;
  providerName: string;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt?: Date;
  scopes?: string[];
  lastUsed?: Date;
}

export interface OutboundAppConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  scopes: string[];
  redirectURL: string;
}

export class OutboundService {
  private sdk: DescopeClient;

  constructor(sdk: DescopeClient) {
    this.sdk = sdk;
  }

  /**
   * Connect to an outbound app using OAuth
   */
  async connect(providerId: string, options?: {
    redirectURL?: string;
    scopes?: string[];
  }): Promise<void> {
    try {
      await this.sdk.outbound.connect(providerId, options);
    } catch (error) {
      console.error(`Error connecting to ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from an outbound app
   */
  async disconnect(providerId: string): Promise<void> {
    try {
      await this.sdk.outbound.disconnect(providerId);
    } catch (error) {
      console.error(`Error disconnecting from ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Get connection status for a provider
   */
  async getConnectionStatus(providerId: string): Promise<OutboundConnection | null> {
    try {
      const connections = await this.sdk.outbound.getConnections();
      const connection = connections.find((conn: any) => conn.providerId === providerId);
      
      if (!connection) {
        return null;
      }

      return {
        id: connection.id,
        providerId: connection.providerId,
        providerName: connection.providerName || providerId,
        status: connection.status === 'active' ? 'connected' : 'disconnected',
        connectedAt: connection.createdAt ? new Date(connection.createdAt) : undefined,
        scopes: connection.scopes,
        lastUsed: connection.lastUsed ? new Date(connection.lastUsed) : undefined,
      };
    } catch (error) {
      console.error(`Error getting connection status for ${providerId}:`, error);
      return null;
    }
  }

  /**
   * Get all connections
   */
  async getAllConnections(): Promise<OutboundConnection[]> {
    try {
      const connections = await this.sdk.outbound.getConnections();
      return connections.map((conn: any) => ({
        id: conn.id,
        providerId: conn.providerId,
        providerName: conn.providerName || conn.providerId,
        status: conn.status === 'active' ? 'connected' : 'disconnected',
        connectedAt: conn.createdAt ? new Date(conn.createdAt) : undefined,
        scopes: conn.scopes,
        lastUsed: conn.lastUsed ? new Date(conn.lastUsed) : undefined,
      }));
    } catch (error) {
      console.error('Error getting all connections:', error);
      return [];
    }
  }

  /**
   * Get tokens for a connected provider
   */
  async getTokens(providerId: string): Promise<any> {
    try {
      const tokens = await this.sdk.outbound.getTokens(providerId);
      return tokens;
    } catch (error) {
      console.error(`Error getting tokens for ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Refresh tokens for a connected provider
   */
  async refreshTokens(providerId: string): Promise<any> {
    try {
      const tokens = await this.sdk.outbound.refreshTokens(providerId);
      return tokens;
    } catch (error) {
      console.error(`Error refreshing tokens for ${providerId}:`, error);
      throw error;
    }
  }
}

// Get outbound app configurations from environment variables
const getOutboundApps = (): OutboundAppConfig[] => {
  const apps: OutboundAppConfig[] = [];
  
  // GitHub11 app configuration
  const github11AppId = process.env.NEXT_PUBLIC_GITHUB11_OUTBOUND_APP_ID || 'github11';
  apps.push({
    id: github11AppId,
    name: 'GitLab',
    description: 'Connect to GitLab for repository management',
    icon: '🦊',
    color: 'text-orange-600 bg-orange-50',
    scopes: [
      'read_user',
      'read_api',
      'read_repository',
      'write_repository',
      'read_registry',
      'write_registry'
    ],
    redirectURL: 'https://api.descope.com/v1/outbound/oauth/callback'
  });
  
  // Docker Hub app configuration
  apps.push({
    id: 'docker',
    name: 'Docker Hub',
    description: 'Connect to Docker Hub for container registry',
    icon: '🐳',
    color: 'text-blue-600 bg-blue-50',
    scopes: [
      'read',
      'write'
    ],
    redirectURL: '/auth/docker/callback'
  });
  
  return apps;
};

// Predefined outbound app configurations
export const OUTBOUND_APPS: OutboundAppConfig[] = getOutboundApps();
