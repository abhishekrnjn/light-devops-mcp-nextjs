import { createClient } from '@descope/nextjs-sdk/client';

export const descopeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID || '',
});

export interface User {
  userId: string;
  name: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}
