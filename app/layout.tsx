import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import { AppLauncher } from "@/components/launcher"
import { BackgroundWrapper } from "@/components/provider/BackgroundWrapper"
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
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col`}>
        <ThemeProvider>
          <div id="header-container" className="flex-none sticky top-0 z-10 bg-background" >
            <AppLauncher />
          </div>
          <div id="main-container">
            <BackgroundWrapper>
              {children}
            </BackgroundWrapper>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
