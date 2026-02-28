import { useRouterState } from '@tanstack/react-router'
import { ChevronRight, Command, Play } from 'lucide-react'

// ─── Breadcrumb helpers ───────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  investments: 'Investments',
  income: 'Income',
  expenses: 'Expenses',
  housing: 'Housing',
  taxes: 'Taxes',
  scenarios: 'Scenarios',
  simulation: 'Simulation',
  settings: 'Settings',
}

const PAGE_LABELS: Record<string, string> = {
  accounts: 'Accounts',
  allocations: 'Allocations',
  'glide-paths': 'Glide Paths',
  employment: 'Employment',
  'social-security': 'Social Security',
  'passive-streams': 'Passive Streams',
  'monthly-import': 'Monthly Import',
  'budget-baseline': 'Budget Baseline',
  categories: 'Categories',
  mortgage: 'Mortgage',
  'home-equity': 'Home Equity',
  'future-events': 'Future Events',
  overview: 'Overview',
  'roth-scenarios': 'Roth Scenarios',
  rmds: 'RMDs',
  configure: 'Configure',
  compare: 'Compare',
  run: 'Run',
  results: 'Results',
}

function getBreadcrumb(pathname: string): string[] {
  if (pathname === '/') return ['Dashboard']
  const segments = pathname.split('/').filter(Boolean)
  return segments.map((seg) => SECTION_LABELS[seg] ?? PAGE_LABELS[seg] ?? seg)
}

function getSectionColor(pathname: string): string {
  if (pathname === '/') return 'var(--section-dashboard)'
  if (pathname.startsWith('/investments')) return 'var(--section-investments)'
  if (pathname.startsWith('/income')) return 'var(--section-income)'
  if (pathname.startsWith('/expenses')) return 'var(--section-expenses)'
  if (pathname.startsWith('/housing')) return 'var(--section-housing)'
  if (pathname.startsWith('/taxes')) return 'var(--section-taxes)'
  if (pathname.startsWith('/scenarios')) return 'var(--section-scenarios)'
  if (pathname.startsWith('/simulation')) return 'var(--section-simulation)'
  return 'var(--text-dim)'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopBar() {
  const { location } = useRouterState()
  const pathname = location.pathname
  const crumbs = getBreadcrumb(pathname)
  const sectionColor = getSectionColor(pathname)

  return (
    <div
      style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--sidebar-bg)',
        gap: 10,
        flexShrink: 0,
      }}
    >
      {/* Breadcrumb */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {/* Section color indicator */}
        <div
          style={{
            width: 3,
            height: 14,
            borderRadius: 2,
            backgroundColor: sectionColor,
            flexShrink: 0,
            transition: 'background-color 200ms ease',
          }}
        />

        {crumbs.map((label, i) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && (
              <ChevronRight size={11} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
            )}
            <span
              style={{
                fontSize: 13,
                color: i === crumbs.length - 1 ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: i === crumbs.length - 1 ? 500 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </span>
        ))}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* ⌘K palette stub */}
        <button
          title="Command palette (Ctrl+K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 7px',
            borderRadius: 5,
            background: 'rgba(240, 246, 252, 0.04)',
            border: '1px solid var(--border)',
            color: 'var(--text-dim)',
            fontSize: 11,
            fontFamily: 'inherit',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          <Command size={10} />
          <span>K</span>
        </button>

        {/* Run Simulation */}
        <button
          title="Run Simulation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 5,
            background: 'rgba(6, 182, 212, 0.10)',
            border: '1px solid rgba(6, 182, 212, 0.28)',
            color: '#06b6d4',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <Play size={10} fill="currentColor" />
          <span>Run Simulation</span>
        </button>
      </div>
    </div>
  )
}
