'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, BookOpen, ChevronRight, Target, TrendingUp } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { StatCard, CardSkeleton, EmptyState, ProgressBar, Skeleton } from '@/components/ui'
import { getAnalytics, getMastery, getWeakTopics, getRecommendation, getRemediation } from '@/services/api'
import { useAuth } from '@/lib/AuthContext'
import { parseBadges } from '@/lib/curriculum'
import { useLanguage } from '@/lib/LanguageContext'

/* ─── Inline design tokens & component styles ─── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  .dash-root {
    --lime:   #c8ff00;
    --lime2:  #a3e635;
    --emerald:#00ffb3;
    --orange: #ff7c2a;
    --red:    #ff4d6d;
    --blue:   #60a5fa;
    --muted:  rgba(255,255,255,0.38);
    --glass:  rgba(255,255,255,0.04);
    --border: rgba(255,255,255,0.08);
    font-family: 'DM Sans', sans-serif;
  }

  .dash-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
  }
  .orb {
    position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.18;
    animation: drift 18s ease-in-out infinite alternate;
  }
  .orb-1 { width:520px; height:520px; top:-160px; left:-120px; background:var(--lime); animation-delay:0s; }
  .orb-2 { width:400px; height:400px; bottom:-100px; right:-80px; background:var(--emerald); animation-delay:-6s; }
  .orb-3 { width:300px; height:300px; top:40%; left:50%; background:var(--orange); opacity:0.1; animation-delay:-12s; }
  @keyframes drift { from { transform: translate(0,0) scale(1); } to { transform: translate(30px,40px) scale(1.06); } }

  .dash-wrap {
    position: relative; z-index: 1;
    max-width: 820px; margin: 0 auto; padding: 1.5rem 1rem 6rem;
  }
  @media(min-width:600px){
    .dash-wrap { padding: 2rem 1.5rem 5rem; }
  }

  .welcome-eyebrow {
    font-family:'Syne',sans-serif; font-size:0.65rem; font-weight:700;
    letter-spacing:0.18em; text-transform:uppercase; color:var(--lime);
    margin-bottom:0.35rem;
  }
  .welcome-heading {
    font-family:'Syne',sans-serif; font-size:1.55rem; font-weight:800;
    line-height:1.15; color:#fff; margin:0 0 0.3rem; word-break:break-word;
  }
  @media(min-width:480px){ .welcome-heading { font-size:2rem; } }
  .welcome-sub {
    font-size:0.82rem; color:var(--muted); letter-spacing:0.01em; line-height:1.5;
  }
  .welcome-rule {
    width:40px; height:3px; border-radius:99px;
    background:linear-gradient(90deg,var(--lime),var(--emerald));
    margin: 0.8rem 0 1.5rem;
  }

  .g-card {
    background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
    border: 1px solid rgba(255,255,255,0.11);
    border-radius: 18px;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    position: relative; overflow: hidden;
    box-shadow:
      0 1px 0 0 rgba(255,255,255,0.08) inset,
      0 -1px 0 0 rgba(0,0,0,0.3) inset,
      0 8px 32px rgba(0,0,0,0.35),
      0 2px 8px rgba(0,0,0,0.2);
  }
  .g-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.06) 100%);
    pointer-events:none; z-index:1;
  }
  .g-card::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(160deg, rgba(255,255,255,0.04) 0%, transparent 45%);
    pointer-events:none; border-radius:inherit;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  @media(min-width:600px){
    .stat-grid { grid-template-columns: repeat(4,1fr); gap:0.875rem; margin-bottom:1.25rem; }
  }
  .stat-tile {
    padding: 1rem 1.1rem;
    display: flex; flex-direction: column; gap: 0.4rem;
    background: linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.1) inset,
      0 12px 40px rgba(0,0,0,0.4),
      0 2px 6px rgba(0,0,0,0.25);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .stat-tile:hover {
    transform: translateY(-2px);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.12) inset,
      0 18px 50px rgba(0,0,0,0.45),
      0 4px 10px rgba(0,0,0,0.3);
  }
  .stat-icon { font-size: 1.25rem; line-height:1; }
  .stat-val {
    font-family:'Syne',sans-serif; font-size:1.5rem; font-weight:800; color:#fff; line-height:1;
    text-shadow: 0 2px 12px rgba(255,255,255,0.15);
  }
  @media(min-width:480px){ .stat-val { font-size:1.75rem; } }
  .stat-label { font-size:0.67rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.09em; font-weight:600; }
  .stat-sub   { font-size:0.67rem; color:var(--muted); margin-top:-0.15rem; }
  .stat-bar   { height:3px; border-radius:99px; margin-top:0.3rem; background:rgba(255,255,255,0.08); overflow:hidden; }
  .stat-bar-fill { height:100%; border-radius:99px; transition:width 1.2s cubic-bezier(.22,1,.36,1); }

  .progress-hero {
    padding: 1.25rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg,
      rgba(200,255,0,0.1) 0%,
      rgba(200,255,0,0.04) 40%,
      rgba(0,255,179,0.06) 100%);
    border-color: rgba(200,255,0,0.22);
    box-shadow:
      0 0 0 1px rgba(200,255,0,0.08) inset,
      0 1px 0 rgba(255,255,255,0.12) inset,
      0 16px 48px rgba(0,0,0,0.45),
      0 0 60px rgba(200,255,0,0.05);
  }
  @media(min-width:600px){ .progress-hero { padding:1.75rem 1.75rem 1.5rem; margin-bottom:1.25rem; } }
  .progress-hero-inner {
    display: flex; flex-direction: column; gap: 1.25rem;
  }
  @media(min-width:560px){
    .progress-hero-inner { flex-direction:row; align-items:center; justify-content:space-between; gap:2rem; }
  }
  .xp-number {
    font-family:'Syne',sans-serif; font-size:3rem; font-weight:800;
    color:var(--lime); line-height:1; letter-spacing:-0.03em;
    text-shadow: 0 0 30px rgba(200,255,0,0.5), 0 0 60px rgba(200,255,0,0.2);
  }
  @media(min-width:480px){ .xp-number { font-size:3.5rem; } }
  .xp-unit { font-size:0.95rem; font-weight:400; color:var(--muted); margin-left:4px; }
  .level-chip {
    display:inline-flex; align-items:center; gap:5px;
    background:rgba(200,255,0,0.1); border:1px solid rgba(200,255,0,0.25);
    border-radius:999px; padding:3px 10px;
    font-size:0.68rem; font-weight:700; color:var(--lime);
    text-transform:uppercase; letter-spacing:0.09em;
  }
  .mastery-track {
    height:6px; border-radius:99px; background:rgba(255,255,255,0.08); overflow:hidden; margin:0.75rem 0 0.5rem;
  }
  .mastery-fill {
    height:100%; border-radius:99px;
    background: linear-gradient(90deg, var(--lime), var(--emerald));
    transition: width 1.4s cubic-bezier(.22,1,.36,1);
    box-shadow: 0 0 12px rgba(200,255,0,0.7), 0 0 28px rgba(200,255,0,0.3);
  }
  .mastery-labels { display:flex; justify-content:space-between; font-size:0.65rem; color:var(--muted); }
  .mastery-right { min-width:0; flex:1; width:100%; }
  @media(min-width:560px){ .mastery-right { min-width:180px; } }
  .badge-pill {
    display:inline-flex; align-items:center;
    background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);
    border-radius:999px; padding:3px 9px;
    font-size:0.68rem; color:rgba(255,255,255,0.7);
  }

  .two-col { display:grid; grid-template-columns:1fr; gap:0.875rem; margin-bottom:1rem; }
  @media(min-width:560px){ .two-col { grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem; } }

  .card-inner {
    padding:1.2rem;
    box-shadow: 0 12px 40px rgba(0,0,0,0.38), 0 2px 8px rgba(0,0,0,0.22);
  }
  @media(min-width:480px){ .card-inner { padding:1.4rem 1.5rem; } }
  .card-header { display:flex; align-items:center; gap:0.55rem; margin-bottom:0.9rem; }
  .card-title { font-family:'Syne',sans-serif; font-weight:700; font-size:0.85rem; color:#fff; }
  .section-icon {
    width:30px; height:30px; border-radius:9px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }

  .weak-row {
    display:flex; justify-content:space-between; align-items:center;
    padding:0.55rem 0.85rem; border-radius:12px; margin-bottom:6px;
    background:rgba(255,77,109,0.07); border:1px solid rgba(255,77,109,0.18);
    transition: background 0.2s;
  }
  .weak-row:hover { background:rgba(255,77,109,0.13); }
  .weak-name { font-size:0.82rem; color:#fca5a5; font-weight:500; }
  .weak-pct  { font-size:0.72rem; font-weight:800; color:#ff4d6d; background:rgba(255,77,109,0.15); padding:2px 7px; border-radius:999px; }

  .mastery-big { font-family:'Syne',sans-serif; font-size:2.8rem; font-weight:800; color:var(--lime); line-height:1; }
  .mastery-denom { font-size:0.9rem; font-weight:400; color:var(--muted); }
  .mastery-level-badge {
    font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;
    padding:3px 10px; border-radius:999px; background:rgba(200,255,0,0.12); color:var(--lime);
    border:1px solid rgba(200,255,0,0.25);
  }

  .rec-chip {
    display:inline-block; font-size:0.68rem; font-weight:700; text-transform:uppercase;
    letter-spacing:0.1em; color:var(--orange); background:rgba(255,124,42,0.12);
    border:1px solid rgba(255,124,42,0.25); border-radius:999px; padding:3px 10px; margin-bottom:8px;
  }
  .rec-text { font-size:0.82rem; color:var(--muted); line-height:1.6; }
  .view-btn {
    display:flex; align-items:center; justify-content:center; gap:6px;
    width:100%; margin-top:1rem; padding:0.6rem;
    border-radius:10px; border:1px solid rgba(255,124,42,0.25);
    background:rgba(255,124,42,0.07); color:var(--orange);
    font-size:0.8rem; font-weight:600; text-decoration:none;
    transition: all 0.2s;
  }
  .view-btn:hover { background:rgba(255,124,42,0.15); }

  .rem-topic {
    font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.12em;
    color:var(--emerald); margin-bottom:0.6rem;
  }
  .rem-text { font-size:0.82rem; color:var(--muted); line-height:1.65; margin-bottom:0.75rem; }
  .rem-tip {
    font-size:0.78rem; color:rgba(148,163,184,0.8); font-style:italic;
    border-left:2px solid rgba(0,255,179,0.3); padding-left:0.65rem;
  }

  .cta-card {
    text-align:center; padding:2rem 1.25rem;
    background:linear-gradient(135deg, rgba(200,255,0,0.07) 0%, rgba(0,255,179,0.04) 100%);
    border-color:rgba(200,255,0,0.18); margin-top:1rem;
  }
  .cta-emoji { font-size:2.2rem; margin-bottom:0.65rem; display:block; }
  .cta-heading { font-family:'Syne',sans-serif; font-size:1.25rem; font-weight:800; color:#fff; margin-bottom:0.4rem; }
  .cta-sub { font-size:0.82rem; color:var(--muted); margin-bottom:1.35rem; line-height:1.5; }
  .cta-btn {
    display:inline-flex; align-items:center; gap:8px;
    background:var(--lime); color:#000;
    font-family:'Syne',sans-serif; font-weight:800; font-size:0.9rem;
    padding:0.75rem 2rem; border-radius:12px; text-decoration:none;
    transition: all 0.2s; box-shadow:0 0 24px rgba(200,255,0,0.25);
  }
  .cta-btn:hover { background:#d4ff1a; box-shadow:0 0 36px rgba(200,255,0,0.4); transform:translateY(-1px); }

  .section-label {
    font-family:'Syne',sans-serif; font-size:0.65rem; font-weight:700;
    letter-spacing:0.18em; text-transform:uppercase; color:var(--muted);
    margin-bottom:0.75rem; margin-top:1.75rem; display:flex; align-items:center; gap:0.5rem;
  }
  .section-label::after { content:''; flex:1; height:1px; background:var(--border); }
`

/* ─── tiny helpers ─── */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

function SectionIcon({ children, color }) {
  return (
    <span className="section-icon" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
      {children}
    </span>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()        // ✅ এখানে — component এর ভেতরে, সব state এর আগে
  const router = useRouter()

  const [analytics, setAnalytics] = useState(null)
  const [mastery, setMastery] = useState(null)
  const [weakTopics, setWeakTopics] = useState([])
  const [recommendation, setRecommendation] = useState(null)
  const [remediation, setRemediation] = useState(null)
  const [loading, setLoading] = useState(true)

  const userId = user?.id

  useEffect(() => {
    if (!user) { setLoading(false); return }
    if (!userId) return
    const classLevel = 8
    Promise.all([
      getAnalytics(userId).catch(() => null),
      getMastery(userId).catch(() => null),
      getWeakTopics(userId).catch(() => []),
      getRecommendation(userId, classLevel).catch(() => null),
      getRemediation(userId, classLevel).catch(() => null),
    ]).then(([a, m, w, r, rem]) => {
      setAnalytics(a)
      setRemediation(rem)
      setMastery(m)
      setWeakTopics(Array.isArray(w) ? w : [])
      setRecommendation(r)
      setLoading(false)
    })
  }, [userId, user])

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  const xp           = analytics?.gamification?.xp ?? 0
  const level        = analytics?.gamification?.level ?? 1
  const streak       = analytics?.gamification?.streak_days ?? 0
  const badges       = parseBadges(analytics?.gamification?.badges)
  const accuracy     = analytics?.average_accuracy ?? 0
  const masteryScore = mastery?.mastery_score ?? 0
  const masteryLevel = mastery?.level ?? '—'

  // ✅ statTiles এখানে — return এর আগে, component এর ভেতরে
  const statTiles = [
    { icon:'⚡', label: t.stats.xpEarned,   value: xp.toLocaleString(), sub: t.stats.totalPoints,    color:'#c8ff00', pct: Math.min((xp / 5000) * 100, 100) },
    { icon:'🎯', label: t.stats.level,      value: level,                sub: t.stats.keepClimbing,   color:'#a3e635', pct: (level / 10) * 100 },
    { icon:'🔥', label: t.stats.streak,     value: `${streak}d`,         sub: t.stats.daysInARow,     color:'#ff7c2a', pct: Math.min((streak / 30) * 100, 100) },
    { icon:'✅', label: t.stats.accuracy,   value: `${accuracy}%`,       sub: t.stats.avgCorrectness, color:'#60a5fa', pct: accuracy },
  ]

  // ✅ return এখানে — DashboardPage function এর ভেতরে
  return (
    <AppLayout title={t.nav.dashboard}>
      <style>{styles}</style>
      <div className="dash-root">

        {/* ambient background */}
        <div className="dash-bg">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className="dash-wrap">

          {/* ── Welcome ── */}
          <motion.div {...fade(0)}>
            <p className="welcome-eyebrow">{t.dashboard.eyebrow}</p>
            <h2 className="welcome-heading">
              {t.dashboard.welcomeBack}&nbsp;
              <span style={{
                background: 'linear-gradient(90deg, #c8ff00, #00ffb3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 18px rgba(200,255,0,0.4))',
              }}>
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </span> 👋
            </h2>
            <p className="welcome-sub">{t.dashboard.subtitle}</p>
            <div className="welcome-rule" />
          </motion.div>

          {/* ── Stat tiles ── */}
          <motion.div {...fade(0.08)} className="stat-grid">
            {loading
              ? [1,2,3,4].map(i => <CardSkeleton key={i} />)
              : statTiles.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="g-card stat-tile"
                  initial={{ opacity:0, y:18 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration:0.45, ease:[0.22,1,0.36,1] }}
                >
                  <span className="stat-icon">{s.icon}</span>
                  <div className="stat-val">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-sub">{s.sub}</div>
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width:`${s.pct}%`, background: s.color, boxShadow:`0 0 8px ${s.color}80` }} />
                  </div>
                </motion.div>
              ))}
          </motion.div>

          {/* ── XP / Mastery Hero ── */}
          <motion.div {...fade(0.2)} className="g-card progress-hero">
            <div className="progress-hero-inner">
              <div>
                <div className="stat-label" style={{ marginBottom:'0.6rem' }}>{t.dashboard.yourProgress}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
                  <span className="xp-number">{xp.toLocaleString()}</span>
                  <span className="xp-unit">XP</span>
                </div>
                <div style={{ marginTop:'0.6rem', display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center' }}>
                  <span className="level-chip">⚡ Level {level}</span>
                  <span className="level-chip" style={{ color:'var(--emerald)', background:'rgba(0,255,179,0.08)', borderColor:'rgba(0,255,179,0.2)' }}>
                    {masteryLevel}
                  </span>
                </div>
              </div>
              <div className="mastery-right">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:'0.75rem', color:'var(--muted)', fontWeight:600 }}>{t.dashboard.masteryScore}</span>
                  <span style={{ fontSize:'0.8rem', fontWeight:800, color:'var(--lime)' }}>{masteryScore}%</span>
                </div>
                <div className="mastery-track">
                  <div className="mastery-fill" style={{ width:`${masteryScore}%` }} />
                </div>
                <div className="mastery-labels">
                  <span>{t.dashboard.beginner}</span><span>{t.dashboard.advanced}</span>
                </div>
                <div style={{ marginTop:'0.75rem', display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                  {loading
                    ? <Skeleton width={80} height={20} />
                    : badges.length > 0
                      ? badges.map(b => <span key={b} className="badge-pill">{b}</span>)
                      : <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{t.dashboard.noBadges}</span>
                  }
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Weak Topics + Mastery Score ── */}
          <p className="section-label">{t.dashboard.analytics}</p>
          <motion.div {...fade(0.28)} className="two-col">

            {/* Weak Topics */}
            <div className="g-card card-inner">
              <div className="card-header">
                <SectionIcon color="#ff4d6d"><AlertTriangle size={15} color="#ff4d6d" /></SectionIcon>
                <span className="card-title">{t.dashboard.weakTopics}</span>
              </div>
              {loading
                ? [1,2,3].map(i => <Skeleton key={i} height={36} style={{ marginBottom:8 }} />)
                : weakTopics.length === 0
                  ? <EmptyState icon="🎉" title={t.dashboard.noWeakTopics} subtitle={t.dashboard.noWeakTopicsSub} />
                  : weakTopics.slice(0, 5).map((tp, i) => (
                    <div key={i} className="weak-row">
                      <span className="weak-name">{tp.topic || tp}</span>
                      {tp.accuracy !== undefined && (
                        <span className="weak-pct">{Math.round(tp.accuracy)}%</span>
                      )}
                    </div>
                  ))
              }
            </div>

            {/* Mastery Score */}
            <div className="g-card card-inner">
              <div className="card-header">
                <SectionIcon color="#c8ff00"><Target size={15} color="#c8ff00" /></SectionIcon>
                <span className="card-title">{t.dashboard.masteryScore}</span>
              </div>
              {loading
                ? <Skeleton height={80} />
                : <>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                    <span className="mastery-big">{masteryScore}</span>
                    <span className="mastery-denom">/100</span>
                  </div>
                  <div className="mastery-track" style={{ marginBottom:10 }}>
                    <div className="mastery-fill" style={{ width:`${masteryScore}%` }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{t.dashboard.beginner}</span>
                    <span className="mastery-level-badge">{masteryLevel}</span>
                    <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{t.dashboard.advanced}</span>
                  </div>
                </>
              }
            </div>
          </motion.div>

          {/* ── AI Recommendation ── */}
          {recommendation && (
            <>
              <p className="section-label">{t.dashboard.aiInsights}</p>
              <motion.div {...fade(0.34)} className="g-card card-inner" style={{ marginBottom:'1rem' }}>
                <div className="card-header">
                  <SectionIcon color="#ff7c2a"><TrendingUp size={15} color="#ff7c2a" /></SectionIcon>
                  <span className="card-title">{t.dashboard.aiRecommendation}</span>
                </div>
                {recommendation.topic && (
                  <span className="rec-chip">{t.dashboard.focusLabel}: {recommendation.topic}</span>
                )}
                <p className="rec-text">
                  {String(recommendation?.recommendation || '').slice(0, 180)}…
                </p>
                <Link href="/recommendations" className="view-btn">
                  {t.dashboard.viewFullPlan} <ChevronRight size={14} />
                </Link>
              </motion.div>
            </>
          )}

          {/* ── AI Remediation ── */}
          {remediation && (
            <motion.div {...fade(0.4)} className="g-card card-inner" style={{ marginBottom:'1rem' }}>
              <div className="card-header">
                <SectionIcon color="#00ffb3"><BookOpen size={15} color="#00ffb3" /></SectionIcon>
                <span className="card-title">{t.dashboard.aiRemediation}</span>
              </div>
              <div className="rem-topic">{t.dashboard.practiceTopic}: {recommendation?.topic}</div>
              <p className="rem-text">
                {remediation?.remediation_content?.concept_explanation}
              </p>
              {remediation?.recommendation?.recommendation && (
                <div className="rem-tip">
                  💡 {remediation.recommendation.recommendation}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CTA ── */}
          <motion.div {...fade(0.45)} className="g-card cta-card">
            <span className="cta-emoji">🚀</span>
            <h3 className="cta-heading">{t.dashboard.readyToLearn}</h3>
            <p className="cta-sub">{t.dashboard.ctaSub}</p>
            <Link href="/learn" className="cta-btn">
              <BookOpen size={18} /> {t.dashboard.continueLearning}
            </Link>
          </motion.div>

        </div>
      </div>
    </AppLayout>
  )
}