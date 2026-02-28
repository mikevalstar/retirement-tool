import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Receipt,
  Home,
  FileText,
  GitBranch,
  Play,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavChild = { label: string; path: string }

type NavSection = {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>
  color: string
  path: string
  children?: NavChild[]
}

const NAV: NavSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    color: '#06b6d4',
    path: '/',
  },
  {
    id: 'investments',
    label: 'Investments',
    icon: TrendingUp,
    color: '#10b981',
    path: '/investments',
    children: [
      { label: 'Accounts', path: '/investments/accounts' },
      { label: 'Allocations', path: '/investments/allocations' },
      { label: 'Glide Paths', path: '/investments/glide-paths' },
    ],
  },
  {
    id: 'income',
    label: 'Income',
    icon: Wallet,
    color: '#14b8a6',
    path: '/income',
    children: [
      { label: 'Employment', path: '/income/employment' },
      { label: 'Social Security', path: '/income/social-security' },
      { label: 'Passive Streams', path: '/income/passive-streams' },
    ],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    color: '#f59e0b',
    path: '/expenses',
    children: [
      { label: 'Monthly Import', path: '/expenses/monthly-import' },
      { label: 'Budget Baseline', path: '/expenses/budget-baseline' },
      { label: 'Categories', path: '/expenses/categories' },
    ],
  },
  {
    id: 'housing',
    label: 'Housing',
    icon: Home,
    color: '#6366f1',
    path: '/housing',
    children: [
      { label: 'Mortgage', path: '/housing/mortgage' },
      { label: 'Home Equity', path: '/housing/home-equity' },
      { label: 'Future Events', path: '/housing/future-events' },
    ],
  },
  {
    id: 'taxes',
    label: 'Taxes',
    icon: FileText,
    color: '#f97316',
    path: '/taxes',
    children: [
      { label: 'Overview', path: '/taxes/overview' },
      { label: 'Roth Scenarios', path: '/taxes/roth-scenarios' },
      { label: 'RMDs', path: '/taxes/rmds' },
    ],
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    icon: GitBranch,
    color: '#8b5cf6',
    path: '/scenarios',
    children: [
      { label: 'Configure', path: '/scenarios/configure' },
      { label: 'Compare', path: '/scenarios/compare' },
    ],
  },
  {
    id: 'simulation',
    label: 'Simulation',
    icon: Play,
    color: '#00e5ff',
    path: '/simulation',
    children: [
      { label: 'Run', path: '/simulation/run' },
      { label: 'Results', path: '/simulation/results' },
    ],
  },
]

// ─── Sidebar component ────────────────────────────────────────────────────────

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { location } = useRouterState()
  const pathname = location.pathname

  // Track which sections are expanded (accordion)
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const s of NAV) {
      if (s.children && (pathname === s.path || pathname.startsWith(s.path + '/'))) {
        initial.add(s.id)
      }
    }
    return initial
  })

  const toggleSection = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Auto-expand the section that contains the current route when navigating
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const s of NAV) {
        if (s.children && (pathname === s.path || pathname.startsWith(s.path + '/'))) {
          next.add(s.id)
        }
      }
      return next
    })
  }, [pathname])

  const isActive = (section: NavSection) =>
    section.path === '/'
      ? pathname === '/'
      : pathname === section.path || pathname.startsWith(section.path + '/')

  const W = collapsed ? 52 : 220

  return (
    <div
      style={{
        width: W,
        minWidth: W,
        maxWidth: W,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        transition: 'width 200ms ease, min-width 200ms ease, max-width 200ms ease',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 10px 0 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          gap: 8,
        }}
      >
        {/* App mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #06b6d4 0%, #2dd4bf 100%)',
              flexShrink: 0,
            }}
          />
          {!collapsed && (
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--text)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Retirement Planner
            </span>
          )}
        </div>

        {/* Collapse toggle (expanded mode only) */}
        {!collapsed && (
          <button
            onClick={onToggle}
            title="Collapse sidebar"
            style={iconBtnStyle}
          >
            <PanelLeftClose size={13} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {NAV.map((section) => {
          const Icon = section.icon
          const active = isActive(section)
          const open = expanded.has(section.id)
          const hasChildren = !!section.children?.length

          return (
            <div key={section.id}>
              {/* Section row */}
              {hasChildren ? (
                <div style={{ display: 'flex', position: 'relative' }}>
                  <Link
                    to={section.path as any}
                    title={collapsed ? section.label : undefined}
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev)
                        next.add(section.id)
                        return next
                      })
                    }
                    style={{ ...rowStyle(active, section.color, collapsed), flex: 1, paddingRight: collapsed ? undefined : 28 }}
                  >
                    <IconSlot collapsed={collapsed} active={active} color={section.color}>
                      <Icon size={15} strokeWidth={1.75} style={{ color: active ? section.color : 'inherit' }} />
                    </IconSlot>
                    {!collapsed && (
                      <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{section.label}</span>
                    )}
                  </Link>
                  {/* Chevron: only toggles accordion, does not navigate */}
                  {!collapsed && (
                    <button
                      onClick={(e) => { e.preventDefault(); toggleSection(section.id) }}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        ...iconBtnStyle,
                      }}
                    >
                      <ChevronDown
                        size={12}
                        style={{
                          color: 'var(--text-dim)',
                          transform: open ? 'rotate(180deg)' : 'none',
                          transition: 'transform 200ms ease',
                        }}
                      />
                    </button>
                  )}
                </div>
              ) : (
                <Link
                  to={section.path as any}
                  title={collapsed ? section.label : undefined}
                  style={rowStyle(active, section.color, collapsed)}
                >
                  <IconSlot collapsed={collapsed} active={active} color={section.color}>
                    <Icon size={15} strokeWidth={1.75} style={{ color: active ? section.color : 'inherit' }} />
                  </IconSlot>
                  {!collapsed && (
                    <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{section.label}</span>
                  )}
                </Link>
              )}

              {/* Children */}
              {hasChildren && !collapsed && (
                <div
                  style={{
                    maxHeight: open ? section.children!.length * 34 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 200ms ease',
                  }}
                >
                  {section.children!.map((child) => {
                    const childActive = pathname === child.path
                    return (
                      <Link
                        key={child.path}
                        to={child.path as any}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          height: 34,
                          padding: '0 12px 0 36px',
                          fontSize: 12.5,
                          color: childActive ? 'var(--text)' : 'var(--text-dim)',
                          borderLeft: `3px solid ${childActive ? section.color : 'transparent'}`,
                          background: childActive ? 'rgba(240, 246, 252, 0.03)' : 'none',
                          transition: 'color 150ms, background 150ms',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {childActive && (
                          <div
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              backgroundColor: section.color,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Divider + Settings ── */}
      <div style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <Link
          to={'/settings' as any}
          title={collapsed ? 'Settings' : undefined}
          style={rowStyle(pathname === '/settings', '#6e7681', collapsed)}
        >
          <IconSlot collapsed={collapsed} active={pathname === '/settings'} color="#6e7681">
            <Settings size={15} strokeWidth={1.75} />
          </IconSlot>
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Settings</span>}
        </Link>
      </div>

      {/* ── Expand button (collapsed mode only) ── */}
      {collapsed && (
        <div style={{ padding: '6px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={onToggle}
            title="Expand sidebar"
            style={{ ...iconBtnStyle, width: '100%', justifyContent: 'center' }}
          >
            <PanelLeftOpen size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

function rowStyle(
  active: boolean,
  color: string,
  collapsed: boolean,
): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? 0 : 6,
    height: 36,
    width: '100%',
    padding: collapsed ? 0 : '0 10px 0 0',
    paddingLeft: 0,
    background: active ? 'rgba(240, 246, 252, 0.05)' : 'none',
    color: active ? 'var(--text)' : 'var(--text-muted)',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    fontFamily: 'inherit',
    cursor: 'pointer',
    border: 'none',
    borderLeft: `3px solid ${active ? color : 'transparent'}`,
    textDecoration: 'none',
    justifyContent: collapsed ? 'center' : 'flex-start',
    transition: 'background 150ms, color 150ms, border-color 150ms',
    boxSizing: 'border-box',
  }
}

function IconSlot({
  collapsed,
  active,
  color,
  children,
}: {
  collapsed: boolean
  active: boolean
  color: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        width: collapsed ? '100%' : 36,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {children}
      {/* Active dot in collapsed mode */}
      {collapsed && active && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
      )}
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 4,
  borderRadius: 4,
  background: 'none',
  border: 'none',
  color: 'var(--text-dim)',
  cursor: 'pointer',
}
