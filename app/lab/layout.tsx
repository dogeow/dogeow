import { Header } from './Header'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="container mx-auto">
      <Header />
      <main className="py-4">{children}</main>
    </div>
  )
}
