import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/app/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { AppLauncher } from '@/components/launcher'
import { BackgroundWrapper } from '@/components/provider/BackgroundWrapper'
import './globals.css'
import { SWRProvider } from '@/components/provider/SWRProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import { LanguageProvider } from '@/components/provider/LanguageProvider'
import { PWAInstallPrompt } from '@/components/app/PWAInstallPrompt'
import { PWARegister } from '@/components/app/PWARegister'
import { LanguageDetectionPrompt } from '@/components/ui/language-detection-prompt'
import '@/lib/i18n/log-control'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'DogeOW - 学习、生活、工作于一体',
  description: 'DogeOW是一个集学习、生活、工作于一体的综合性平台',
  keywords: ['DogeOW'],
  authors: [{ name: 'DogeOW' }],
  creator: 'DogeOW',
  publisher: 'DogeOW',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://dogeow.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'DogeOW - 学习、生活、工作于一体',
    description: 'DogeOW是一个集学习、生活、工作于一体的综合性平台',
    url: 'https://dogeow.com',
    siteName: 'DogeOW',
    images: [
      {
        url: '/480.png',
        width: 480,
        height: 480,
        alt: 'DogeOW Logo',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DogeOW - 学习、生活、工作于一体',
    description: 'DogeOW是一个集学习、生活、工作于一体的综合性平台',
    images: ['/480.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '64x64 32x32 24x24 16x16', type: 'image/x-icon' },
      { url: '/80.png', sizes: '80x80', type: 'image/png' },
      { url: '/480.png', sizes: '480x480', type: 'image/png' },
    ],
    apple: [{ url: '/480.png', sizes: '480x480', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'DogeOW',
    'msapplication-TileColor': '#000000',
    'theme-color': '#000000',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex h-screen flex-col antialiased`}
      >
        <SWRProvider>
          <ThemeProvider>
            <LanguageProvider>
              <div
                id="header-container"
                className="bg-background sticky top-0 z-30 h-[50px] flex-none border-b shadow-sm"
              >
                <div className="mx-auto flex h-full w-full max-w-7xl items-center">
                  <AppLauncher />
                </div>
              </div>
              <div id="main-container" className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                <div className="mx-auto flex h-full w-full max-w-7xl flex-col p-0">
                  <BackgroundWrapper>
                    <ProtectedRoute>{children}</ProtectedRoute>
                  </BackgroundWrapper>
                </div>
              </div>
              <Toaster />
              <PWAInstallPrompt />
              <PWARegister />
              <LanguageDetectionPrompt />
            </LanguageProvider>
          </ThemeProvider>
        </SWRProvider>
      </body>
    </html>
  )
}
