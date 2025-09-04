/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React StrictMode to prevent double mounting of components
  // This is necessary for Descope authentication component to work properly
  reactStrictMode: false,
  
  // Suppress hydration warnings in development for browser extension attributes
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Experimental features for better hydration handling
  experimental: {
    // Improve hydration performance
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
