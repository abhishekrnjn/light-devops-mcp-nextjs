import { getSessionToken } from '@descope/nextjs-sdk/client';

interface TokenInfo {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

class TokenRefreshService {
  private tokenCache: Map<string, TokenInfo> = new Map();
  private refreshPromises: Map<string, Promise<string>> = new Map();

  /**
   * Get a valid token, refreshing if necessary
   */
  async getValidToken(): Promise<string | null> {
    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        return null;
      }

      // For now, just return the session token
      // In a more complex implementation, you might want to check expiration
      // and refresh if needed
      return sessionToken;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  /**
   * Refresh a token
   */
  async refreshToken(): Promise<string | null> {
    try {
      // For Descope, we typically don't need to manually refresh tokens
      // as the SDK handles this automatically
      const sessionToken = getSessionToken();
      return sessionToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Clear cached tokens
   */
  clearCache(): void {
    this.tokenCache.clear();
    this.refreshPromises.clear();
  }

  /**
   * Check if a token is expired
   */
  private isTokenExpired(tokenInfo: TokenInfo): boolean {
    return Date.now() >= tokenInfo.expiresAt;
  }

  /**
   * Get token from cache or create new one
   */
  private async getCachedToken(key: string): Promise<string | null> {
    const cached = this.tokenCache.get(key);
    
    if (cached && !this.isTokenExpired(cached)) {
      return cached.token;
    }

    // If there's already a refresh in progress, wait for it
    if (this.refreshPromises.has(key)) {
      return await this.refreshPromises.get(key)!;
    }

    // Start refresh process
    const refreshPromise = this.refreshToken();
    this.refreshPromises.set(key, refreshPromise);

    try {
      const newToken = await refreshPromise;
      if (newToken) {
        this.tokenCache.set(key, {
          token: newToken,
          expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
        });
      }
      return newToken;
    } finally {
      this.refreshPromises.delete(key);
    }
  }
}

// Export singleton instance
export const tokenRefreshService = new TokenRefreshService();
