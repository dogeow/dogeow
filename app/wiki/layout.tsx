export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh' }}>
      <main style={{ flex: 1, minHeight: 0 }}>{children}</main>
    </div>
  )
}
