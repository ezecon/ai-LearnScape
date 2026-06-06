'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  BookOpen,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Brain,
  Target,
  Zap,
  TrendingUp
} from 'lucide-react'

import AppLayout from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui'
import {
  getRecommendation,
  getRemediation,
  getWeakTopics
} from '@/services/api'
import { useAuth } from '@/lib/AuthContext'
import toast from 'react-hot-toast'

// ─── Inline styles & keyframes via <style> ────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');

    :root {
      --rec-bg: #09090f;
      --rec-surface: #0f0f1a;
      --rec-card: #13131f;
      --rec-border: rgba(255,255,255,0.06);
      --rec-text: #f0f0ff;
      --rec-muted: rgba(240,240,255,0.45);
      --rec-lime: #c8ff00;
      --rec-orange: #ff6b2b;
      --rec-red: #ff4060;
      --rec-blue: #5b8fff;
      --rec-purple: #a855f7;
    }

    .rec-root * { box-sizing: border-box; margin: 0; padding: 0; }
    .rec-root { font-family: 'DM Sans', sans-serif; background: var(--rec-bg); min-height: 100vh; color: var(--rec-text); }

    /* Animated mesh background */
    .rec-bg-mesh {
      position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
    }
    .rec-bg-mesh::before {
      content: '';
      position: absolute; width: 900px; height: 900px;
      top: -300px; left: -200px;
      background: radial-gradient(circle at 40% 40%, rgba(200,255,0,0.04) 0%, transparent 60%);
      animation: meshFloat 12s ease-in-out infinite alternate;
    }
    .rec-bg-mesh::after {
      content: '';
      position: absolute; width: 700px; height: 700px;
      bottom: -200px; right: -150px;
      background: radial-gradient(circle at 60% 60%, rgba(91,143,255,0.06) 0%, transparent 60%);
      animation: meshFloat 16s ease-in-out infinite alternate-reverse;
    }
    @keyframes meshFloat {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(40px, 30px) scale(1.08); }
    }

    /* Grid noise texture */
    .rec-noise {
      position: fixed; inset: 0; pointer-events: none; z-index: 1;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
      background-size: 200px 200px; opacity: 0.4;
    }

    .rec-wrap { position: relative; z-index: 2; max-width: 780px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }

    /* ── Header ── */
    .rec-header { margin-bottom: 2.5rem; }
    .rec-eyebrow {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(200,255,0,0.08); border: 1px solid rgba(200,255,0,0.2);
      color: var(--rec-lime); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      padding: 0.3rem 0.75rem; border-radius: 999px; margin-bottom: 1rem;
    }
    .rec-title {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 900; line-height: 1.05;
      color: var(--rec-text);
      letter-spacing: -0.02em;
    }
    .rec-title span { color: var(--rec-lime); }
    .rec-subtitle { color: var(--rec-muted); font-size: 0.9rem; margin-top: 0.6rem; line-height: 1.6; font-weight: 400; }

    /* ── Cards ── */
    .rec-card {
      background: var(--rec-card);
      border: 1px solid var(--rec-border);
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s, transform 0.3s;
    }
    .rec-card:hover { border-color: rgba(255,255,255,0.1); transform: translateY(-2px); }

    /* Glow strip at top of each card */
    .rec-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      opacity: 0.5;
    }
    .rec-card.card-red::before    { background: linear-gradient(90deg, transparent, var(--rec-red), transparent); }
    .rec-card.card-lime::before   { background: linear-gradient(90deg, transparent, var(--rec-lime), transparent); }
    .rec-card.card-orange::before { background: linear-gradient(90deg, transparent, var(--rec-orange), transparent); }

    /* Corner accent */
    .rec-card-glow {
      position: absolute; width: 200px; height: 200px;
      top: -80px; right: -60px;
      border-radius: 50%; pointer-events: none; opacity: 0.05;
      filter: blur(40px);
    }
    .card-red   .rec-card-glow { background: var(--rec-red); }
    .card-lime  .rec-card-glow { background: var(--rec-lime); }
    .card-orange .rec-card-glow { background: var(--rec-orange); }

    .rec-card-label {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 1rem;
    }
    .rec-card-label-text {
      font-family: 'Syne', sans-serif;
      font-size: 0.75rem; font-weight: 800;
      letter-spacing: 0.1em; text-transform: uppercase;
    }
    .label-red    { color: var(--rec-red); }
    .label-lime   { color: var(--rec-lime); }
    .label-orange { color: var(--rec-orange); }

    .rec-icon-wrap {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .icon-red    { background: rgba(255,64,96,0.15); }
    .icon-lime   { background: rgba(200,255,0,0.12); }
    .icon-orange { background: rgba(255,107,43,0.15); }

    /* ── Weak topic chips ── */
    .topic-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .topic-chip {
      background: rgba(255,64,96,0.1);
      border: 1px solid rgba(255,64,96,0.25);
      color: #ff7a8a;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-size: 0.78rem; font-weight: 600;
      transition: background 0.2s, border-color 0.2s;
    }
    .topic-chip:hover { background: rgba(255,64,96,0.18); border-color: rgba(255,64,96,0.45); }
    .no-topics { color: var(--rec-muted); font-size: 0.88rem; display: flex; align-items: center; gap: 6px; }

    /* ── Recommendation content ── */
    .rec-focus-row {
      display: flex; align-items: center; gap: 10px; margin-bottom: 0.75rem;
    }
    .rec-focus-badge {
      background: rgba(200,255,0,0.1); border: 1px solid rgba(200,255,0,0.2);
      color: var(--rec-lime); font-size: 0.72rem; font-weight: 700;
      padding: 0.2rem 0.6rem; border-radius: 6px; letter-spacing: 0.06em;
    }
    .rec-focus-topic {
      font-family: 'Syne', sans-serif; font-size: 1.15rem; font-weight: 800;
      color: var(--rec-text);
    }
    .rec-body { color: var(--rec-muted); line-height: 1.75; font-size: 0.9rem; font-weight: 400; }

    /* ── Example block ── */
    .rec-example {
      margin-top: 1rem;
      background: rgba(255,107,43,0.06);
      border: 1px solid rgba(255,107,43,0.18);
      border-radius: 14px;
      padding: 1rem 1.1rem;
    }
    .rec-example-header {
      display: flex; align-items: center; gap: 6px; margin-bottom: 0.5rem;
      font-size: 0.7rem; font-weight: 700; color: var(--rec-orange);
      text-transform: uppercase; letter-spacing: 0.1em;
    }
    .rec-example-body { color: var(--rec-muted); font-size: 0.85rem; line-height: 1.65; }

    /* ── Insight callout ── */
    .rec-note {
      margin-top: 1rem;
      background: rgba(91,143,255,0.06); border-left: 3px solid rgba(91,143,255,0.4);
      border-radius: 0 10px 10px 0; padding: 0.75rem 1rem;
      color: rgba(160,185,255,0.8); font-size: 0.83rem; font-style: italic; line-height: 1.6;
    }

    /* ── Stats row ── */
    .rec-stats {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 10px; margin-bottom: 1rem;
    }
    .rec-stat {
      background: var(--rec-card); border: 1px solid var(--rec-border);
      border-radius: 14px; padding: 1rem;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      transition: border-color 0.3s, transform 0.3s;
    }
    .rec-stat:hover { border-color: rgba(255,255,255,0.1); transform: translateY(-2px); }
    .rec-stat-icon { opacity: 0.7; margin-bottom: 2px; }
    .rec-stat-val {
      font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 900;
      color: var(--rec-text); letter-spacing: -0.02em;
    }
    .rec-stat-label { font-size: 0.7rem; color: var(--rec-muted); font-weight: 500; text-align: center; }

    /* ── Buttons ── */
    .rec-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 0.5rem; }
    .rec-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 0.85rem 1.25rem; border-radius: 12px;
      font-size: 0.88rem; font-weight: 700; cursor: pointer;
      transition: all 0.2s; border: none; text-decoration: none;
      letter-spacing: 0.01em;
    }
    .rec-btn-primary {
      background: var(--rec-lime); color: #09090f;
    }
    .rec-btn-primary:hover { background: #d8ff20; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(200,255,0,0.25); }
    .rec-btn-primary:active { transform: translateY(0); }
    .rec-btn-ghost {
      background: rgba(255,255,255,0.05); color: var(--rec-text);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .rec-btn-ghost:hover { background: rgba(255,255,255,0.09); transform: translateY(-2px); }

    /* Spinning icon */
    .spin { animation: spinIt 0.7s linear infinite; display: inline-flex; }
    @keyframes spinIt { to { transform: rotate(360deg); } }

    /* ── Loading ── */
    .rec-loading {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 5rem 2rem; gap: 1rem;
    }
    .rec-loading-ring {
      width: 48px; height: 48px; border-radius: 50%;
      border: 2px solid rgba(200,255,0,0.15);
      border-top-color: var(--rec-lime);
      animation: spinIt 0.8s linear infinite;
    }
    .rec-loading-text { color: var(--rec-muted); font-size: 0.88rem; }

    /* Divider */
    .rec-divider { height: 1px; background: var(--rec-border); margin: 0.5rem 0 1.25rem; }

    /* Stagger helpers */
    .stagger-1 { animation-delay: 0.05s; }
    .stagger-2 { animation-delay: 0.12s; }
    .stagger-3 { animation-delay: 0.19s; }
    .stagger-4 { animation-delay: 0.26s; }
    .stagger-5 { animation-delay: 0.33s; }

    @media (max-width: 520px) {
      .rec-stats { grid-template-columns: repeat(3, 1fr); }
      .rec-title { font-size: 1.8rem; }
    }
  `}</style>
)

// ─── Framer motion variants ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }
  })
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RecommendationPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [recommendation, setRecommendation] = useState(null)
  const [remediation, setRemediation] = useState(null)
  const [weakTopics, setWeakTopics] = useState([])

  const classLevel = user?.user_metadata?.class_level || 8

  const loadData = async (isRefresh = false) => {
    if (!user?.id) return
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const [rec, rem, weak] = await Promise.all([
        getRecommendation(user.id, classLevel),
        getRemediation(user.id, classLevel),
        getWeakTopics(user.id)
      ])
      setRecommendation(rec)
      setRemediation(rem)
      setWeakTopics(Array.isArray(weak) ? weak : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load recommendation')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { if (user?.id) loadData() }, [user])

  const focusTopic = recommendation?.topic || 'Fractions'
  const recText = recommendation?.recommendation || 'Practice more to improve your mastery.'
  const concept = remediation?.remediation_content?.concept_explanation
  const example = remediation?.remediation_content?.example
  const recNote = remediation?.recommendation?.recommendation

  return (
    <AppLayout title="Recommendations">
      <GlobalStyles />
      <div className="rec-root">
        <div className="rec-bg-mesh" />
        <div className="rec-noise" />
        <div className="rec-wrap">

          {/* ── Header ── */}
          <motion.div
            className="rec-header"
            variants={fadeUp} custom={0}
            initial="hidden" animate="show"
          >
            <div className="rec-eyebrow">
              <Brain size={10} />
              AI-Powered Learning
            </div>
            <h1 className="rec-title">
              Your Learning<br />
              <span>Intelligence</span>
            </h1>
            <p className="rec-subtitle">
              Tailored recommendations built from your performance patterns and knowledge gaps.
            </p>
          </motion.div>

          {/* ── Loading State ── */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                className="rec-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="rec-loading-ring" />
                <p className="rec-loading-text">Analysing your performance…</p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* ── Stats ── */}
                <motion.div
                  className="rec-stats"
                  variants={fadeUp} custom={1}
                  initial="hidden" animate="show"
                >
                  {[
                    { icon: <Target size={16} color="var(--rec-lime)" />, val: focusTopic.split(' ')[0], label: 'Focus Area' },
                    { icon: <Zap size={16} color="var(--rec-orange)" />, val: weakTopics.length || '0', label: 'Weak Topics' },
                    { icon: <TrendingUp size={16} color="var(--rec-blue)" />, val: `Cl. ${classLevel}`, label: 'Your Level' },
                  ].map((s, i) => (
                    <div className="rec-stat" key={i}>
                      <div className="rec-stat-icon">{s.icon}</div>
                      <div className="rec-stat-val">{s.val}</div>
                      <div className="rec-stat-label">{s.label}</div>
                    </div>
                  ))}
                </motion.div>

                {/* ── Weak Topics ── */}
                <motion.div
                  variants={fadeUp} custom={2}
                  initial="hidden" animate="show"
                  className="rec-card card-red"
                >
                  <div className="rec-card-glow" />
                  <div className="rec-card-label">
                    <div className="rec-icon-wrap icon-red">
                      <AlertTriangle size={15} color="var(--rec-red)" />
                    </div>
                    <span className="rec-card-label-text label-red">Weak Topics</span>
                  </div>
                  <div className="rec-divider" />
                  <div className="topic-chips">
                    {weakTopics.length > 0
                      ? weakTopics.map((topic, i) => (
                          <span key={i} className="topic-chip">
                            {topic?.topic || topic}
                          </span>
                        ))
                      : (
                        <p className="no-topics">
                          <span>🎉</span>
                          No weak topics detected — you're on fire!
                        </p>
                      )
                    }
                  </div>
                </motion.div>

                {/* ── AI Recommendation ── */}
                <motion.div
                  variants={fadeUp} custom={3}
                  initial="hidden" animate="show"
                  className="rec-card card-lime"
                >
                  <div className="rec-card-glow" />
                  <div className="rec-card-label">
                    <div className="rec-icon-wrap icon-lime">
                      <Sparkles size={15} color="var(--rec-lime)" />
                    </div>
                    <span className="rec-card-label-text label-lime">AI Recommendation</span>
                  </div>
                  <div className="rec-divider" />
                  <div className="rec-focus-row">
                    <span className="rec-focus-badge">Focus</span>
                    <span className="rec-focus-topic">{focusTopic}</span>
                  </div>
                  <p className="rec-body">{recText}</p>
                </motion.div>

                {/* ── Personalized Lesson ── */}
                <motion.div
                  variants={fadeUp} custom={4}
                  initial="hidden" animate="show"
                  className="rec-card card-orange"
                >
                  <div className="rec-card-glow" />
                  <div className="rec-card-label">
                    <div className="rec-icon-wrap icon-orange">
                      <BookOpen size={15} color="var(--rec-orange)" />
                    </div>
                    <span className="rec-card-label-text label-orange">Personalized Lesson</span>
                  </div>
                  <div className="rec-divider" />
                  <p className="rec-body">
                    {concept || 'No remediation available yet. Keep practising to unlock personalized lessons.'}
                  </p>

                  {example && (
                    <div className="rec-example">
                      <div className="rec-example-header">
                        <Lightbulb size={13} />
                        Worked Example
                      </div>
                      <p className="rec-example-body">{example}</p>
                    </div>
                  )}

                  {recNote && (
                    <div className="rec-note">
                      💬 {recNote}
                    </div>
                  )}
                </motion.div>

                {/* ── Actions ── */}
                <motion.div
                  variants={fadeUp} custom={5}
                  initial="hidden" animate="show"
                  className="rec-actions"
                >
                  <button
                    onClick={() => loadData(true)}
                    className="rec-btn rec-btn-primary"
                    disabled={refreshing}
                  >
                    <span className={refreshing ? 'spin' : ''}>
                      <RefreshCw size={15} />
                    </span>
                    {refreshing ? 'Refreshing…' : 'Refresh'}
                  </button>

                  <Link href="/learn" className="rec-btn rec-btn-ghost">
                    <ArrowRight size={15} />
                    Practice Now
                  </Link>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AppLayout>
  )
}