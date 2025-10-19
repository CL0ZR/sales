import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "نظام إدارة المستودعات",
  description: "نظام إدارة المستودعات والمبيعات",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "إدارة المستودعات",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CurrencyProvider>
            <AppProvider>
              <Layout>
                {children}
              </Layout>
              <Toaster />
            </AppProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
