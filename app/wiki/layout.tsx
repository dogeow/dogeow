export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh' }}>
      <header style={{ padding: '12px 16px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Wiki 知识图谱</h1>
      </header>
      <main style={{ flex: 1, minHeight: 0 }}>{children}</main>
    </div>
  )
}
