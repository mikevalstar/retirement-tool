import { createFileRoute } from '@tanstack/react-router'
import { Upload, FileText, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/expenses/')({ component: ExpensesPage })

const ACCENT = 'var(--section-expenses)'
const ACCENT_HEX = '#f59e0b'

function ExpensesPage() {
  return (
    <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
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
          Expenses
        </h1>
      </div>

      {/* Sub-nav tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          gap: 0,
        }}
      >
        {['Monthly Import', 'Budget Baseline', 'Categories'].map((tab, i) => (
          <button
            key={tab}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontFamily: 'inherit',
              fontWeight: i === 0 ? 500 : 400,
              color: i === 0 ? ACCENT : 'var(--text-muted)',
              background: 'none',
              border: 'none',
              borderBottom: i === 0 ? `2px solid ${ACCENT_HEX}` : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Monthly Import content ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Drop zone */}
        <div
          style={{
            border: `2px dashed color-mix(in srgb, ${ACCENT_HEX} 30%, var(--border))`,
            borderRadius: 10,
            padding: '36px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            background: `color-mix(in srgb, ${ACCENT_HEX} 4%, var(--surface))`,
            cursor: 'pointer',
            transition: 'border-color 150ms, background 150ms',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: `color-mix(in srgb, ${ACCENT_HEX} 14%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Upload size={22} style={{ color: ACCENT }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              Drop a CSV or paste transactions
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Export from your credit card or bank, then drop the file here.
              <br />
              Multiple cards can be imported in one session.
            </div>
          </div>

          <button
            style={{
              padding: '7px 18px',
              borderRadius: 6,
              background: `color-mix(in srgb, ${ACCENT_HEX} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${ACCENT_HEX} 35%, transparent)`,
              color: ACCENT,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            Choose file
          </button>
        </div>

        {/* Empty state */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 120px 160px',
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              gap: 12,
            }}
          >
            {['Merchant', 'Date', 'Amount', 'Category'].map((col) => (
              <span
                key={col}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                {col}
              </span>
            ))}
          </div>

          {/* Empty rows placeholder */}
          <div
            style={{
              padding: '40px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} style={{ color: 'var(--text-dim)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No transactions imported for this month
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
              Import a CSV above to begin reviewing and categorizing expenses
            </div>
          </div>
        </div>

        {/* How it works */}
        <div
          style={{
            padding: '14px 18px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${ACCENT}`,
            borderRadius: 8,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <FileText size={14} style={{ color: ACCENT, marginTop: 1, flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>
              How import works
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {[
                'Known merchants auto-assign their saved category — those rows are collapsed',
                'Unknown merchants surface at the top for manual assignment',
                'Assignments are saved permanently — next import is faster',
                'A running sidebar shows category totals as you work',
              ].map((tip) => (
                <li key={tip} style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
