import { Header } from './Header'
import { PageContainer } from '@/components/layout'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <PageContainer className="py-0">
      <Header />
      <main className="py-4">{children}</main>
    </PageContainer>
  )
}
