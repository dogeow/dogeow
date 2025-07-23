import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { AppLauncher } from '@/components/launcher'
import { BackgroundWrapper } from '@/components/provider/BackgroundWrapper'
import './globals.css'
import 'prismjs/themes/prism.css'
import './note/styles/prism.css'
import { SWRProvider } from '@/components/provider/SWRProvider'
import ProtectedRoute from '@/components/ProtectedRoute'

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
  title: 'Doge先锋',
  description: '学习、生活、工作于一体',
  icons: {
    apple: '/480.png',
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
            <div
              id="header-container"
              className="bg-background sticky top-0 z-30 h-[50px] flex-none border-b shadow-sm"
            >
              <div className="mx-auto flex h-full w-full max-w-7xl items-center">
                <AppLauncher />
              </div>
            </div>
            <div id="main-container" className="flex-1 overflow-x-hidden">
              <div className="mx-auto h-full w-full max-w-7xl p-0">
                <BackgroundWrapper>
                  <ProtectedRoute>{children}</ProtectedRoute>
                </BackgroundWrapper>
              </div>
            </div>
            <Toaster />
          </ThemeProvider>
        </SWRProvider>
      </body>
    </html>
  )
}
