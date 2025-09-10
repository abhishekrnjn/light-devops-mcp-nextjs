/**
 * Request deduplication utility to prevent multiple identical API calls
 */

interface RequestCache {
  [key: string]: Promise<any>;
}

class RequestDeduplication {
  private cache: RequestCache = {};
  private inProgress: Set<string> = new Set();

  /**
   * Execute a request with deduplication
   * @param key Unique key for the request
   * @param requestFn Function that makes the actual request
   * @returns Promise with the result
   */
  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already in progress, return the existing promise
    if (this.inProgress.has(key)) {
      console.log(`🔄 Request ${key} already in progress, waiting for existing request`);
      return this.cache[key];
    }

    // If we have a cached result, return it
    if (this.cache[key]) {
      console.log(`📋 Request ${key} found in cache, returning cached result`);
      return this.cache[key];
    }

    // Mark as in progress and execute the request
    this.inProgress.add(key);
    console.log(`🚀 Starting new request ${key}`);

    try {
      const promise = requestFn();
      this.cache[key] = promise;
      
      const result = await promise;
      console.log(`✅ Request ${key} completed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Request ${key} failed:`, error);
      // Remove from cache on error so it can be retried
      delete this.cache[key];
      throw error;
    } finally {
      this.inProgress.delete(key);
    }
  }

  /**
   * Clear the cache for a specific key or all keys
   * @param key Optional key to clear, if not provided clears all
   */
  clear(key?: string): void {
    if (key) {
      delete this.cache[key];
      this.inProgress.delete(key);
      console.log(`🗑️ Cleared cache for request ${key}`);
    } else {
      this.cache = {};
      this.inProgress.clear();
      console.log(`🗑️ Cleared all request cache`);
    }
  }

  /**
   * Check if a request is currently in progress
   * @param key Request key to check
   * @returns True if request is in progress
   */
  isInProgress(key: string): boolean {
    return this.inProgress.has(key);
  }

  /**
   * Get the current cache size
   * @returns Number of cached requests
   */
  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }
}

// Export singleton instance
export const requestDeduplication = new RequestDeduplication();
