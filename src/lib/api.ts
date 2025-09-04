const API_BASE_URL = 'http://localhost:8000';

export interface LogEntry {
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  timestamp: string;
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
}

export interface Deployment {
  service_name: string;
  version: string;
  environment: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: string;
}

export interface Rollback {
  reason: string;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
  deployment_id?: string;
}

export interface UserInfo {
  user_id: string;
  login_id?: string;
  email?: string;
  name?: string;
  tenant?: string;
  roles: string[];
  permissions: string[];
  scopes: string[];
}

// Get JWT token from user data
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('user_data');
    console.log('🔑 Raw user_data from localStorage:', userData);
    
    if (!userData) {
      console.log('❌ No user_data found in localStorage');
      return null;
    }
    
    const parsed = JSON.parse(userData);
    console.log('🔍 Parsed user data:', parsed);
    console.log('🎫 sessionToken from parsed data:', parsed.sessionToken);
    
    const token = parsed.sessionToken || null;
    console.log('✅ Final token to use:', token ? `${token.substring(0, 20)}...` : 'null');
    
    return token;
  } catch (error) {
    console.error('❌ Error parsing user data:', error);
    return null;
  }
}

// Create authenticated headers
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function fetchApiData<T>(endpoint: string): Promise<T[]> {
  try {
    const headers = getAuthHeaders();
    console.log(`Making request to ${API_BASE_URL}/${endpoint}`, { headers });
    
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers,
      cache: 'no-store',
    });
    
    console.log(`Response from ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log('Authentication failed - 401 Unauthorized');
        // Don't auto-redirect, let the component handle it
        return [];
      }
      
      const errorText = await response.text();
      console.error(`API Error for ${endpoint}:`, errorText);
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Data from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Get current user information from backend
export async function getCurrentUser(): Promise<UserInfo | null> {
  try {
    const token = getAuthToken();
    if (!token) {
      console.log('❌ No token available for getCurrentUser');
      return null;
    }
    
    const headers = getAuthHeaders();
    console.log('Getting current user info from backend...');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/me`, {
      headers,
      cache: 'no-store',
    });
    
    console.log('User info response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log('Authentication failed for user info - token may be expired');
        return null;
      }
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }
    
    const userInfo = await response.json();
    console.log('✅ User info from backend:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('❌ Error fetching user info:', error);
    return null;
  }
}

// Logout user
export async function logoutUser(): Promise<boolean> {
  try {
    const headers = getAuthHeaders();
    console.log('Logging out user...');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/logout`, {
      method: 'POST',
      headers,
    });
    
    console.log('Logout response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    // Clear local storage regardless of backend response
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data');
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Clear local storage even on error
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data');
    }
    return false;
  }
}

// Check if user has specific permission
export function hasPermission(userInfo: UserInfo | null, permission: string): boolean {
  if (!userInfo) return false;
  return userInfo.permissions.includes(permission);
}

// Check if user has any of the specified roles
export function hasAnyRole(userInfo: UserInfo | null, roles: string[]): boolean {
  if (!userInfo) return false;
  return roles.some(role => userInfo.roles.includes(role));
}
