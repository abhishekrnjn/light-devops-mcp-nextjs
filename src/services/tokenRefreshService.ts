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

      // Check if token is expired by parsing JWT
      if (this.isTokenExpired(sessionToken)) {
        console.log('🔑 Session token expired, Descope will handle refresh automatically');
        // Let Descope handle the refresh - just return null for now
        // The next request will trigger Descope's automatic refresh
        return null;
      }

      return sessionToken;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  /**
   * Check if a JWT token is expired by parsing the exp claim
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true; // Assume expired if we can't parse
    }
  }

  /**
   * Clear any pending refresh operations
   */
  clearCache(): void {
    this.refreshPromises.clear();
  }
}

// Export singleton instance
export const tokenRefreshService = new TokenRefreshService();

