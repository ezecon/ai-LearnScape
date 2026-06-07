'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, Lightbulb, Trophy,
  LogOut, Zap, Menu, X, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { History } from 'lucide-react'

// NAV array তে যোগ করো:

const NAV = [
  { href: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard',       accent: '#c8ff00' },
  { href: '/learn',           icon: BookOpen,        label: 'Learn',           accent: '#00ffb3' },
  { href: '/recommendations', icon: Lightbulb,       label: 'Recommendations', accent: '#ff7c2a' },
  { href: '/leaderboard',     icon: Trophy,          label: 'Leaderboard',     accent: '#facc15' },
  { href: '/history',         icon: History,         label: 'History',         accent: '#6ee7ff' },
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .sb-root {
    width: 240px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: rgba(8, 9, 10, 0.96);
    border-right: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    position: relative;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    flex-shrink: 0;
  }

  .sb-root::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(200,255,0,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(200,255,0,0.025) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none; z-index: 0;
  }

  .sb-glow {
    position: absolute;
    width: 280px; height: 280px;
    top: -90px; left: -90px;
    background: radial-gradient(circle, rgba(200,255,0,0.1) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
    animation: sbpulse 6s ease-in-out infinite alternate;
  }
  @keyframes sbpulse { from { opacity:0.6; transform:scale(1); } to { opacity:1; transform:scale(1.15); } }

  .sb-inner { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }

  /* ── Logo ── */
  .sb-logo {
    padding: 1.4rem 1.25rem 1.2rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; gap: 0.7rem;
  }
  .sb-logo-icon {
    width: 36px; height: 36px; border-radius: 11px;
    background: #c8ff00;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 18px rgba(200,255,0,0.4);
    flex-shrink: 0;
  }
  .sb-logo-name {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 0.92rem;
    color: #fff; line-height: 1; letter-spacing: -0.01em;
  }
  .sb-logo-tag {
    font-size: 0.62rem; font-weight: 600;
    color: #c8ff00; letter-spacing: 0.12em;
    text-transform: uppercase; margin-top: 2px;
  }

  .sb-section {
    font-family: 'Syne', sans-serif;
    font-size: 0.6rem; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(255,255,255,0.22);
    padding: 1.1rem 1.25rem 0.4rem;
  }

  /* ── Nav ── */
  .sb-nav { flex: 1; padding: 0.5rem 0.7rem; display: flex; flex-direction: column; gap: 2px; }

  .sb-link {
    display: flex; align-items: center; gap: 0.7rem;
    padding: 0.65rem 0.85rem;
    border-radius: 12px;
    text-decoration: none;
    font-size: 0.86rem; font-weight: 500;
    color: rgba(255,255,255,0.45);
    transition: all 0.18s ease;
    position: relative; overflow: hidden;
    white-space: nowrap;
    border: 1px solid transparent;
  }
  .sb-link:hover {
    color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.08);
  }
  .sb-link.active {
    color: #fff; font-weight: 600;
    border-color: rgba(255,255,255,0.1);
  }
  .sb-link-glow {
    position: absolute; inset: 0;
    opacity: 0; border-radius: inherit;
    transition: opacity 0.2s;
  }
  .sb-link.active .sb-link-glow { opacity: 1; }

  .sb-link-icon {
    width: 30px; height: 30px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.18s;
    background: rgba(255,255,255,0.05);
  }
  .sb-link.active .sb-link-icon { box-shadow: 0 0 10px color-mix(in srgb, var(--acc) 38%, transparent); }
  .sb-link:hover .sb-link-icon { background: rgba(255,255,255,0.08); }

  .sb-link-arrow {
    margin-left: auto; opacity: 0; transition: opacity 0.15s, transform 0.15s;
    transform: translateX(-4px);
  }
  .sb-link.active .sb-link-arrow { opacity: 0.5; transform: translateX(0); }

  /* ── Footer ── */
  .sb-footer {
    padding: 0.85rem;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .sb-user {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.6rem 0.65rem;
    border-radius: 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    margin-bottom: 0.6rem;
  }
  .sb-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(200,255,0,0.12);
    border: 1.5px solid rgba(200,255,0,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.78rem; font-weight: 700; color: #c8ff00;
    flex-shrink: 0;
  }
  .sb-user-name {
    font-size: 0.75rem; font-weight: 600; color: #fff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;
  }
  .sb-user-role { font-size: 0.62rem; color: rgba(255,255,255,0.3); letter-spacing: 0.04em; }
  .sb-logout {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 0.52rem;
    border-radius: 10px;
    background: rgba(255,77,77,0.07);
    border: 1px solid rgba(255,77,77,0.18);
    color: rgba(255,120,120,0.8);
    font-size: 0.78rem; font-weight: 600;
    cursor: pointer; transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
  }
  .sb-logout:hover {
    background: rgba(255,77,77,0.14);
    color: #ff8080;
    border-color: rgba(255,77,77,0.3);
  }

  /* ── Toggle button ── */
  .sb-toggle {
    position: fixed; top: 14px; left: 14px; z-index: 50;
    width: 40px; height: 40px; border-radius: 12px;
    background: rgba(10,10,14,0.92);
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(14px);
    display: flex; align-items: center; justify-content: center;
    color: #fff; cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    transition: all 0.18s;
  }
  .sb-toggle:hover {
    border-color: rgba(200,255,0,0.35);
    box-shadow: 0 4px 20px rgba(200,255,0,0.12);
  }
`

function SidebarContent({ onClose }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="sb-root">
      <style>{css}</style>
      <div className="sb-glow" />
      <div className="sb-inner">

        {/* Logo + close */}
        <div className="sb-logo" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div className="sb-logo-icon">
              <Zap size={20} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <div className="sb-logo-name">LearnScape</div>
              <div className="sb-logo-tag">AI Tutor</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 9,
              width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.18s',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <div className="sb-section">Navigation</div>
        <nav className="sb-nav">
          {NAV.map(({ href, icon: Icon, label, accent }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`sb-link ${active ? 'active' : ''}`}
                style={{ '--acc': accent }}
                onClick={onClose}
              >
                <span
                  className="sb-link-glow"
                  style={{ background: `linear-gradient(135deg, ${accent}14 0%, transparent 60%)` }}
                />
                <span
                  className="sb-link-icon"
                  style={active ? { background: `${accent}18`, border: `1px solid ${accent}30` } : {}}
                >
                  <Icon size={15} color={active ? accent : 'rgba(255,255,255,0.4)'} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                {label}
                <ChevronRight size={13} className="sb-link-arrow" />
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          {user && (
            <div className="sb-user">
              <div className="sb-avatar">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div className="sb-user-name">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </div>
                <div className="sb-user-role">Student</div>
              </div>
            </div>
          )}
          <button className="sb-logout" onClick={handleLogout}>
            <LogOut size={13} /> Logout
          </button>
        </div>

      </div>
    </div>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{css}</style>

      {/* Hamburger — always visible */}
      <button
        className="sb-toggle"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.72)',
                backdropFilter: 'blur(5px)',
                zIndex: 39,
              }}
            />

            {/* Sidebar panel */}
            <motion.div
              key="panel"
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              style={{
                position: 'fixed', left: 0, top: 0,
                zIndex: 40, height: '100vh',
              }}
            >
              <SidebarContent onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}