import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import { AppLauncher } from "@/components/launcher"
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
  title: "Doge先锋",
  description: "学习、生活、工作于一体",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ 
          overflow: 'hidden',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <ThemeProvider>
          <div style={{ 
            flex: 'none', 
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'var(--background)'
          }}>
            <AppLauncher />
          </div>
          <div 
            id="main-content"
            style={{
              overflow: 'auto',
              margin: '8px 8px'
            }}
          >
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
