'use client'
import { Loader2 } from 'lucide-react'

// ── Skeleton ─────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 20, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 8, ...style }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '1.25rem' }}>
      <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
      <Skeleton height={32} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={12} />
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = 'var(--lime)' }) {
  return (
    <Loader2
      size={size}
      color={color}
      style={{ animation: 'spin 1s linear infinite' }}
    />
  )
}

// Add spin keyframe via inline
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'
  if (!document.head.querySelector('[data-spin]')) {
    style.dataset.spin = true
    document.head.appendChild(style)
  }
}

// ── StatCard ──────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, sub, color = 'lime', loading = false }) {
  const colors = {
    lime:   { bg: 'rgba(204,255,0,0.08)',   border: 'rgba(204,255,0,0.2)',  text: 'var(--lime)' },
    green:  { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)', text: '#22c55e' },
    red:    { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
    orange: { bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)', text: '#f97316' },
    blue:   { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)', text: '#3b82f6' },
  }
  const c = colors[color] || colors.lime

  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 16, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: 8
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      {loading ? (
        <Skeleton height={36} width="60%" />
      ) : (
        <div style={{ fontSize: '2rem', fontWeight: 800, color: c.text, lineHeight: 1 }}>{value}</div>
      )}
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.5rem' }}>{title}</div>
      {subtitle && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{subtitle}</div>}
      {action}
    </div>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────
export function ProgressBar({ percent, label, showPercent = true }) {
  return (
    <div>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          {label && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>}
          {showPercent && <span style={{ fontSize: '0.8rem', color: 'var(--lime)', fontWeight: 700 }}>{percent}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  )
}
