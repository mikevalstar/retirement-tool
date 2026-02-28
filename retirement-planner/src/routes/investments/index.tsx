import { createFileRoute } from '@tanstack/react-router'
import { TrendingUp, Plus, BarChart3, Route as RouteIcon, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/investments/')({ component: InvestmentsPage })

const ACCENT = 'var(--section-investments)'
const ACCENT_HEX = '#10b981'

function SectionCard({
  title,
  count,
  sub,
  status,
  icon: Icon,
}: {
  title: string
  count?: string
  sub: string
  status: 'empty' | 'ok'
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: '18px 20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              backgroundColor: `color-mix(in srgb, ${ACCENT_HEX} 12%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={14} style={{ color: ACCENT }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{title}</span>
        </div>
        {status === 'empty' && (
          <AlertCircle size={13} style={{ color: 'var(--text-dim)' }} />
        )}
      </div>

      {count !== undefined ? (
        <div className="num" style={{ fontSize: 24, fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}>
          {count}
        </div>
      ) : (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-dim)',
            fontStyle: 'italic',
          }}
        >
          Not configured
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function InvestmentsPage() {
  return (
    <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 4,
              height: 20,
              borderRadius: 2,
              backgroundColor: ACCENT,
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Investments
          </h1>
        </div>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 6,
            background: `color-mix(in srgb, ${ACCENT_HEX} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${ACCENT_HEX} 30%, transparent)`,
            color: ACCENT,
            fontSize: 12.5,
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <Plus size={13} />
          Add Account
        </button>
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Track your investment accounts, target allocations, and de-risking strategy. These values
        feed directly into the Monte Carlo simulation.
      </p>

      {/* Sub-section cards */}
      <div style={{ display: 'flex', gap: 14 }}>
        <SectionCard
          title="Accounts"
          count="0"
          sub="Add brokerage, 401(k), IRA, and other investment accounts"
          status="empty"
          icon={TrendingUp}
        />
        <SectionCard
          title="Allocations"
          sub="Set your target stock/bond mix per account or globally"
          status="empty"
          icon={BarChart3}
        />
        <SectionCard
          title="Glide Paths"
          sub="Configure how your allocation shifts as you approach retirement"
          status="empty"
          icon={RouteIcon}
        />
      </div>

      {/* Getting started guidance */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${ACCENT}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>
          Getting started
        </div>
        <ol
          style={{
            margin: 0,
            paddingLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {[
            'Add each investment account with its current balance and type',
            'Set a target allocation (e.g. 80% stocks / 20% bonds)',
            'Optionally configure a glide path to shift allocation over time',
          ].map((step) => (
            <li key={step} style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
