import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevOps MCP Dashboard",
  description: "Real-time monitoring and deployment management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent hydration mismatch from browser extensions
              if (typeof window !== 'undefined') {
                // Remove common extension attributes that cause hydration issues
                const extensionAttrs = [
                  'data-new-gr-c-s-check-loaded',
                  'data-gr-ext-installed',
                  'data-new-gr-c-s-loaded',
                  'cz-shortcut-listen'
                ];
                extensionAttrs.forEach(attr => {
                  if (document.body.hasAttribute(attr)) {
                    document.body.removeAttribute(attr);
                  }
                });
              }
            `,
          }}
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
