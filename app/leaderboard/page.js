'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Flame, Crown, Zap, RefreshCw } from 'lucide-react'

import AppLayout from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui'
import { getLeaderboard } from '@/services/api'
import toast from 'react-hot-toast'

/* ─── Global Styles ──────────────────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800;900&family=Outfit:wght@300;400;500;600;700&display=swap');

    :root {
      --lb-bg: #07080e;
      --lb-surface: #0c0d18;
      --lb-card: #10111e;
      --lb-border: rgba(255,255,255,0.07);
      --lb-text: #eef0ff;
      --lb-muted: rgba(220,225,255,0.4);
      --lb-gold: #ffd166;
      --lb-silver: #b8c4d8;
      --lb-bronze: #e07a44;
      --lb-accent: #6ee7ff;
      --lb-green: #4fffb0;
      --lb-rank-bg: rgba(255,255,255,0.04);
    }

    .lb-root { font-family: 'Outfit', sans-serif; background: var(--lb-bg); min-height: 100vh; color: var(--lb-text); }
    .lb-root * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Background ── */
    .lb-bg {
      position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
    }
    .lb-bg-orb {
      position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.07;
      animation: orbDrift 18s ease-in-out infinite alternate;
    }
    .lb-bg-orb-1 { width: 600px; height: 600px; background: var(--lb-gold); top: -200px; left: -100px; animation-duration: 14s; }
    .lb-bg-orb-2 { width: 500px; height: 500px; background: var(--lb-accent); bottom: -150px; right: -100px; animation-duration: 20s; animation-direction: alternate-reverse; }
    .lb-bg-orb-3 { width: 300px; height: 300px; background: var(--lb-green); top: 40%; left: 50%; opacity: 0.04; animation-duration: 25s; }
    @keyframes orbDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(30px, 40px) scale(1.1); }
    }

    /* Scanlines */
    .lb-scanlines {
      position: fixed; inset: 0; z-index: 1; pointer-events: none;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px);
    }

    .lb-wrap { position: relative; z-index: 2; max-width: 720px; margin: 0 auto; padding: 2.5rem 1.25rem 5rem; }

    /* ── Header ── */
    .lb-header { text-align: center; margin-bottom: 2.5rem; }
    .lb-trophy-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 64px; height: 64px; border-radius: 20px;
      background: linear-gradient(135deg, rgba(255,209,102,0.2), rgba(255,209,102,0.05));
      border: 1px solid rgba(255,209,102,0.3);
      margin-bottom: 1rem;
      animation: iconPulse 3s ease-in-out infinite;
    }
    @keyframes iconPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,209,102,0); }
      50%      { box-shadow: 0 0 0 12px rgba(255,209,102,0.08); }
    }
    .lb-title {
      font-family: 'Unbounded', sans-serif;
      font-size: clamp(1.8rem, 5vw, 2.6rem);
      font-weight: 900; letter-spacing: -0.02em;
      line-height: 1.1;
      background: linear-gradient(135deg, #ffd166 0%, #ffedaa 50%, #ffc842 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .lb-subtitle { color: var(--lb-muted); font-size: 0.85rem; margin-top: 0.5rem; font-weight: 400; }

    /* ── Podium ── */
    .lb-podium {
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      align-items: end; gap: 8px;
      margin-bottom: 2rem;
    }

    .lb-podium-card {
      border-radius: 18px 18px 14px 14px;
      padding: 1.25rem 0.75rem 1rem;
      text-align: center;
      border: 1px solid transparent;
      position: relative; overflow: hidden;
      transition: transform 0.3s;
      cursor: default;
    }
    .lb-podium-card:hover { transform: translateY(-4px); }

    /* Gold */
    .lb-podium-card.gold {
      background: linear-gradient(160deg, rgba(255,209,102,0.13) 0%, rgba(255,209,102,0.04) 100%);
      border-color: rgba(255,209,102,0.3);
      padding-top: 1.75rem;
    }
    /* Silver */
    .lb-podium-card.silver {
      background: linear-gradient(160deg, rgba(184,196,216,0.1) 0%, rgba(184,196,216,0.03) 100%);
      border-color: rgba(184,196,216,0.25);
    }
    /* Bronze */
    .lb-podium-card.bronze {
      background: linear-gradient(160deg, rgba(224,122,68,0.1) 0%, rgba(224,122,68,0.03) 100%);
      border-color: rgba(224,122,68,0.25);
    }

    /* Glow strip */
    .lb-podium-card::before {
      content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
    }
    .gold::before   { background: linear-gradient(90deg, transparent, var(--lb-gold), transparent); }
    .silver::before { background: linear-gradient(90deg, transparent, var(--lb-silver), transparent); }
    .bronze::before { background: linear-gradient(90deg, transparent, var(--lb-bronze), transparent); }

    .lb-rank-crown {
      position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
      font-size: 1.1rem; line-height: 1;
    }

    .lb-podium-avatar {
      width: 52px; height: 52px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Unbounded', sans-serif;
      font-size: 1.1rem; font-weight: 900;
      margin: 0 auto 0.6rem;
      position: relative;
    }
    .lb-podium-avatar.gold   { background: linear-gradient(135deg, #ffd166, #ffb300); color: #3a2000; }
    .lb-podium-avatar.silver { background: linear-gradient(135deg, #b8c4d8, #8ea0b8); color: #1a2030; }
    .lb-podium-avatar.bronze { background: linear-gradient(135deg, #e07a44, #c55a24); color: #2a1000; }

    .lb-podium-name {
      font-weight: 700; font-size: 0.82rem; color: var(--lb-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .lb-podium-xp {
      font-family: 'Unbounded', sans-serif;
      font-size: 0.9rem; font-weight: 800;
    }
    .lb-podium-xp.gold   { color: var(--lb-gold); }
    .lb-podium-xp.silver { color: var(--lb-silver); }
    .lb-podium-xp.bronze { color: var(--lb-bronze); }
    .lb-podium-level { font-size: 0.7rem; color: var(--lb-muted); margin-top: 2px; font-weight: 500; }

    .lb-podium-pos {
      position: absolute; bottom: 0; left: 0; right: 0;
      font-family: 'Unbounded', sans-serif;
      font-size: 0.65rem; font-weight: 800;
      letter-spacing: 0.08em; opacity: 0.5;
      padding: 0.25rem; text-align: center;
    }

    /* ── Rankings list ── */
    .lb-list { display: flex; flex-direction: column; gap: 8px; }

    .lb-row {
      background: var(--lb-card);
      border: 1px solid var(--lb-border);
      border-radius: 14px;
      padding: 0.9rem 1.1rem;
      display: flex; align-items: center; gap: 12px;
      transition: border-color 0.25s, transform 0.25s, background 0.25s;
      cursor: default;
      position: relative; overflow: hidden;
    }
    .lb-row:hover {
      border-color: rgba(110,231,255,0.2);
      background: rgba(16,17,30,0.9);
      transform: translateX(4px);
    }

    /* Hover left glow bar */
    .lb-row::before {
      content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
      width: 2px; background: var(--lb-accent);
      border-radius: 999px; opacity: 0;
      transition: opacity 0.25s;
    }
    .lb-row:hover::before { opacity: 0.6; }

    .lb-row-rank {
      font-family: 'Unbounded', sans-serif;
      font-size: 0.75rem; font-weight: 800;
      color: var(--lb-muted); min-width: 28px; text-align: center;
    }

    .lb-row-avatar {
      width: 38px; height: 38px; border-radius: 12px;
      background: rgba(110,231,255,0.1); border: 1px solid rgba(110,231,255,0.15);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.85rem; color: var(--lb-accent);
      flex-shrink: 0;
    }

    .lb-row-info { flex: 1; min-width: 0; }
    .lb-row-name { font-weight: 700; font-size: 0.9rem; color: var(--lb-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lb-row-badges { font-size: 0.72rem; color: var(--lb-muted); margin-top: 1px; }

    .lb-row-right { text-align: right; flex-shrink: 0; }
    .lb-row-xp {
      font-family: 'Unbounded', sans-serif;
      font-size: 0.85rem; font-weight: 800; color: var(--lb-green);
    }
    .lb-row-level { font-size: 0.7rem; color: var(--lb-muted); margin-top: 2px; }

    /* XP progress bar on row */
    .lb-row-bar-wrap { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.04); }
    .lb-row-bar { height: 100%; background: linear-gradient(90deg, var(--lb-accent), var(--lb-green)); border-radius: 0 999px 999px 0; transition: width 1s ease; }

    /* ── Section label ── */
    .lb-section-label {
      font-family: 'Unbounded', sans-serif;
      font-size: 0.6rem; font-weight: 800;
      letter-spacing: 0.15em; text-transform: uppercase;
      color: var(--lb-muted); margin-bottom: 0.75rem; padding-left: 4px;
      display: flex; align-items: center; gap: 8px;
    }
    .lb-section-label::after { content: ''; flex: 1; height: 1px; background: var(--lb-border); }

    /* ── Empty ── */
    .lb-empty {
      text-align: center; padding: 4rem 1rem;
      color: var(--lb-muted); font-size: 0.9rem;
    }

    /* ── Loading ── */
    .lb-loading {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 5rem; gap: 1rem;
    }
    .lb-loading-ring {
      width: 44px; height: 44px; border-radius: 50%;
      border: 2px solid rgba(255,209,102,0.15);
      border-top-color: var(--lb-gold);
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .lb-loading-text { color: var(--lb-muted); font-size: 0.85rem; }

    /* You badge */
    .lb-you { 
      background: rgba(110,231,255,0.12); border: 1px solid rgba(110,231,255,0.3);
      color: var(--lb-accent); font-size: 0.6rem; font-weight: 700;
      padding: 0.15rem 0.45rem; border-radius: 999px; letter-spacing: 0.08em;
      margin-left: 6px; vertical-align: middle;
    }

    @media (max-width: 480px) {
      .lb-podium-avatar { width: 42px; height: 42px; font-size: 0.9rem; }
      .lb-podium-card { padding: 1rem 0.5rem 0.75rem; }
      .lb-podium-name { font-size: 0.72rem; }
    }
  `}</style>
)

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

const maxXp = (leaders) => Math.max(...leaders.map(l => l.xp || 0), 1)

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }
  })
}

const podiumOrder = [1, 0, 2] // silver, gold, bronze visual order

/* ─── Podium Card ────────────────────────────────────────────────────────────── */
function PodiumCard({ user, rank, delay }) {
  const cls = ['gold', 'silver', 'bronze'][rank]
  const crowns = ['👑', null, null]
  const positions = ['1st', '2nd', '3rd']
  const heightBonus = rank === 0 ? 'paddingTop: 1.75rem' : ''

  return (
    <motion.div
      variants={fadeUp} custom={delay}
      initial="hidden" animate="show"
      className={`lb-podium-card ${cls}`}
    >
      {crowns[rank] && <div className="lb-rank-crown">{crowns[rank]}</div>}
      <div className={`lb-podium-avatar ${cls}`}>{initials(user?.name)}</div>
      <div className="lb-podium-name">{user?.name || '—'}</div>
      <div className={`lb-podium-xp ${cls}`}>{(user?.xp || 0).toLocaleString()} <span style={{fontSize:'0.65rem', fontWeight:500}}>XP</span></div>
      <div className="lb-podium-level">Lv {user?.level || 1}</div>
      <div className="lb-podium-pos">{positions[rank]}</div>
    </motion.div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true)
  const [leaders, setLeaders] = useState([])

  useEffect(() => { fetchLeaderboard() }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const data = await getLeaderboard()
      setLeaders(data || [])
    } catch {
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const top3 = leaders.slice(0, 3)
  const rest = leaders.slice(3)
  const peak = maxXp(leaders)

  // Reorder top3 for podium: [silver(1), gold(0), bronze(2)]
  const podiumSlots = [top3[1], top3[0], top3[2]]

  return (
    <AppLayout title="Leaderboard">
      <GlobalStyles />
      <div className="lb-root">
        <div className="lb-bg">
          <div className="lb-bg-orb lb-bg-orb-1" />
          <div className="lb-bg-orb lb-bg-orb-2" />
          <div className="lb-bg-orb lb-bg-orb-3" />
        </div>
        <div className="lb-scanlines" />

        <div className="lb-wrap">

          {/* Header */}
          <motion.div
            className="lb-header"
            variants={fadeUp} custom={0}
            initial="hidden" animate="show"
          >
            <div className="lb-trophy-icon">
              <Trophy size={28} color="var(--lb-gold)" />
            </div>
            <h1 className="lb-title">Leaderboard</h1>
            <p className="lb-subtitle">The best learners, ranked by XP earned</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" className="lb-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="lb-loading-ring" />
                <p className="lb-loading-text">Loading rankings…</p>
              </motion.div>
            ) : leaders.length === 0 ? (
              <motion.div key="empty" className="lb-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Trophy size={40} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
                No learners yet. Be the first!
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* Podium */}
                {top3.length > 0 && (
                  <>
                    <div className="lb-section-label"><Star size={10} /> Hall of Fame</div>
                    <div className="lb-podium">
                      {podiumSlots.map((user, visualIdx) => {
                        // map visual slot back to rank
                        const rankMap = [1, 0, 2]
                        const rank = rankMap[visualIdx]
                        return user
                          ? <PodiumCard key={rank} user={user} rank={rank} delay={visualIdx + 1} />
                          : <div key={visualIdx} />
                      })}
                    </div>
                  </>
                )}

                {/* Rankings */}
                {rest.length > 0 && (
                  <>
                    <div className="lb-section-label" style={{ marginTop: '1.25rem' }}>
                      <Flame size={10} /> Rising Learners
                    </div>
                    <div className="lb-list">
                      {rest.map((user, i) => {
                        const pct = Math.round((user.xp / peak) * 100)
                        return (
                          <motion.div
                            key={i}
                            variants={fadeUp} custom={i + 4}
                            initial="hidden" animate="show"
                            className="lb-row"
                          >
                            <div className="lb-row-rank">#{i + 4}</div>
                            <div className="lb-row-avatar">{initials(user.name)}</div>
                            <div className="lb-row-info">
                              <div className="lb-row-name">{user.name}</div>
                              {user.badges && <div className="lb-row-badges">{user.badges}</div>}
                            </div>
                            <div className="lb-row-right">
                              <div className="lb-row-xp">{(user.xp || 0).toLocaleString()}<span style={{ fontSize: '0.6rem', fontWeight: 500, marginLeft: 3 }}>XP</span></div>
                              <div className="lb-row-level">Lv {user.level}</div>
                            </div>
                            <div className="lb-row-bar-wrap">
                              <motion.div
                                className="lb-row-bar"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, delay: (i + 4) * 0.06, ease: 'easeOut' }}
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AppLayout>
  )
}