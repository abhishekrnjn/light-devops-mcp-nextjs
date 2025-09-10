import { getSessionToken } from '@descope/nextjs-sdk/client';

/**
 * Simplified token service that relies on Descope's built-in token management
 * Descope handles token refresh automatically, so we don't need custom refresh logic
 */
class TokenRefreshService {
  private refreshPromises: Map<string, Promise<string | null>> = new Map();

  /**
   * Get a valid session token
   * Descope SDK handles token refresh automatically
   */
  async getValidToken(): Promise<string | null> {
    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        console.log('🔑 No session token available');
        return null;
      }

      // Let Descope handle token refresh automatically
      // Don't check expiry here as it can be too aggressive
      // Descope will handle refresh when needed

      return sessionToken;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  // Removed isTokenExpired function - let Descope handle token refresh automatically

  /**
   * Clear any pending refresh operations
   */
  clearCache(): void {
    this.refreshPromises.clear();
  }
}

// Export singleton instance
export const tokenRefreshService = new TokenRefreshService();

