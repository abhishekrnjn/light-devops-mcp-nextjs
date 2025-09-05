import { AuthProvider } from '@descope/nextjs-sdk';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  return (
    <AuthProvider projectId="P32IDP9Hdywv6N4G6REYR2uddVc3">
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </AuthProvider>
  );
}