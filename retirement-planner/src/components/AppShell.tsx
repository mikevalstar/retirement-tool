import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

type AppShellProps = {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Rehydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const handleToggle = () => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--app-bg)',
      }}
    >
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <TopBar />

        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
