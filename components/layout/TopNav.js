'use client'
import { useAuth } from '@/lib/AuthContext'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .tn-root {
    height: 64px;
    background: linear-gradient(180deg,
      rgba(14,16,18,0.97) 0%,
      rgba(10,11,13,0.92) 100%);
    border-bottom: 1px solid rgba(255,255,255,0.09);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
    position: sticky;
    top: 0;
    z-index: 30;
    font-family: 'DM Sans', sans-serif;
    gap: 1rem;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.06) inset,
      0 4px 24px rgba(0,0,0,0.5),
      0 1px 3px rgba(0,0,0,0.3);
  }

  /* top inset highlight */
  .tn-root::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255,255,255,0.12) 30%,
      rgba(200,255,0,0.18) 60%,
      transparent 100%);
    pointer-events: none;
  }

  /* bottom shimmer */
  .tn-root::after {
    content: '';
    position: absolute;
    bottom: 0; left: 5%; right: 5%;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(200,255,0,0.45),
      rgba(0,255,179,0.25),
      transparent);
    opacity: 0.8;
  }

  /* ── Title ── */
  .tn-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.05rem; font-weight: 800;
    background: linear-gradient(90deg, #fff 0%, rgba(200,255,0,0.9) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 14px rgba(200,255,0,0.25));
    letter-spacing: -0.02em;
    white-space: nowrap;
    margin-left: 2.5rem;
  }
  @media(min-width: 768px) { .tn-title { margin-left: 0; } }

  /* ── Breadcrumb ── */
  .tn-breadcrumb {
    display: none;
    align-items: center; gap: 0.35rem;
    font-size: 0.72rem; color: rgba(255,255,255,0.3);
  }
  @media(min-width: 480px) { .tn-breadcrumb { display: flex; } }
  .tn-breadcrumb-sep { opacity: 0.3; }
  .tn-breadcrumb-cur {
    color: rgba(255,255,255,0.55); font-weight: 600;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Right cluster ── */
  .tn-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

  /* ── Avatar ── */
  .tn-avatar-wrap { position: relative; cursor: pointer; }
  .tn-avatar {
    width: 38px; height: 38px; border-radius: 11px;
    background: linear-gradient(145deg, rgba(200,255,0,0.22) 0%, rgba(200,255,0,0.06) 100%);
    border: 1.5px solid rgba(200,255,0,0.38);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.82rem; font-weight: 800; color: #c8ff00;
    transition: all 0.18s ease;
    font-family: 'DM Sans', sans-serif;
    text-shadow: 0 0 12px rgba(200,255,0,0.6);
    box-shadow:
      0 1px 0 rgba(200,255,0,0.15) inset,
      0 4px 16px rgba(0,0,0,0.4),
      0 0 20px rgba(200,255,0,0.08);
  }
  .tn-avatar:hover {
    border-color: rgba(200,255,0,0.6);
    box-shadow:
      0 1px 0 rgba(200,255,0,0.2) inset,
      0 6px 20px rgba(0,0,0,0.45),
      0 0 28px rgba(200,255,0,0.18);
    transform: scale(1.05);
  }
  .tn-online {
    position: absolute; bottom: -1px; right: -1px;
    width: 9px; height: 9px; border-radius: 50%;
    background: #22c55e;
    border: 2px solid rgba(8,9,10,0.9);
    box-shadow: 0 0 6px rgba(34,197,94,0.6);
  }
`

export default function TopNav({ title = 'LearnScape AI' }) {
  const { user } = useAuth()

  const initials = user?.email?.charAt(0).toUpperCase() || 'U'
  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'

  return (
    <>
      <style>{css}</style>
      <header className="tn-root">

        {/* Left: title + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '0 0 auto' }}>
          <h1 className="tn-title">{title}</h1>
          <div className="tn-breadcrumb">
            <span className="tn-breadcrumb-sep">/</span>
            <span className="tn-breadcrumb-cur">{username}</span>
          </div>
        </div>

        {/* Right: avatar only */}
        <div className="tn-right">
          <div className="tn-avatar-wrap">
            <div className="tn-avatar">{initials}</div>
            <span className="tn-online" />
          </div>
        </div>

      </header>
    </>
  )
}