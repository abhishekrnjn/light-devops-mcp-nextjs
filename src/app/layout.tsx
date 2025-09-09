import { AuthProvider } from '@descope/nextjs-sdk';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OutboundConnectionProvider } from '@/contexts/OutboundConnectionContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevOps Authentication",
  description: "Simple authentication with Descope",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const projectId = process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_DESCOPE_BASE_URL || 'https://api.descope.com';
  const mcpServerUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001';

  if (!projectId) {
    throw new Error('NEXT_PUBLIC_DESCOPE_PROJECT_ID environment variable is required');
  }

  return (
    <AuthProvider
      projectId={projectId}
      baseUrl={baseUrl}
      persistTokens={true}
      sessionTokenViaCookie={false}
      storeLastAuthenticatedUser={true}
      keepLastAuthenticatedUserAfterLogout={false}
    >
      <OutboundConnectionProvider>
        <html lang="en">
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            {children}
          </body>
        </html>
      </OutboundConnectionProvider>
    </AuthProvider>
  );
}