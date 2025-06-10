import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import { AppLauncher } from "@/components/launcher"
import { BackgroundWrapper } from "@/components/provider/BackgroundWrapper"
import "./globals.css";
import "prismjs/themes/prism.css";
import "./note/styles/prism.css";
import { SWRProvider } from "@/components/provider/SWRProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Doge先锋",
  description: "学习、生活、工作于一体",
  icons: {
    apple: "/images/480.png",
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
        <SWRProvider>
          <ThemeProvider>
            <div id="header-container" className="flex-none sticky top-0 z-30 h-[50px] bg-background border-b shadow-sm">
              <div className="content-container flex h-full items-center">
                <AppLauncher />
              </div>
            </div>
            <div id="main-container" className="flex-1 overflow-x-hidden">
              <div className="content-container p-0 h-full">
                <BackgroundWrapper>
                  {children}
                </BackgroundWrapper>
              </div>
            </div>
            <Toaster />
          </ThemeProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
