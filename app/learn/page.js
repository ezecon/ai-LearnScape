'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, RefreshCw, CheckCircle, XCircle,
  Lightbulb, BookOpen, ChevronDown, ChevronUp,
  ArrowRight, RotateCcw, Eye, Sparkles
} from 'lucide-react'

import AppLayout from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui'
import { generateQuestion, submitAnswer, getRemediation } from '@/services/api'
import { useAuth } from '@/lib/AuthContext'
import { TOPICS_BY_CLASS, ENVIRONMENTS, CLASS_LEVELS, getTopicIcon } from '@/lib/curriculum'
import toast from 'react-hot-toast'

// ─── Step constants ────────────────────────────────────────────────────────────
const STEP = { SETUP: 'setup', QUESTION: 'question', RESULT: 'result' }

// ─── Parse raw string content ──────────────────────────────────────────────────
function parseContent(raw) {
  if (typeof raw !== 'string') return raw
  const get = (label, next) => {
    const pattern = next
      ? new RegExp(`${label}:?\\s*([\\s\\S]*?)(?=${next}:|$)`, 'i')
      : new RegExp(`${label}:?\\s*([\\s\\S]*)$`, 'i')
    const m = raw.match(pattern)
    return m ? m[1].trim() : ''
  }
  return {
    concept_explanation: get('Concept Explanation', 'Example'),
    example: get('Example', 'Word Problem'),
    word_problem: get('Word Problem', 'Answer'),
    answer: get('Answer', 'Step'),
    step_by_step_solution: get('Step-by-Step Solution')
      .split('\n').filter(l => l.trim())
      .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean),
  }
}

// ─── Global styles ─────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Familjen+Grotesk:wght@700;800&display=swap');

    :root {
      --ln-bg: #080a10;
      --ln-card: #0e1018;
      --ln-border: rgba(255,255,255,0.07);
      --ln-text: #eef0ff;
      --ln-muted: rgba(220,225,255,0.42);
      --ln-lime: #c8ff00;
      --ln-green: #22c55e;
      --ln-red: #ef4444;
      --ln-blue: #60a5fa;
      --ln-orange: #f97316;
      --ln-amber: #f59e0b;
    }

    .ln-root { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--ln-text); }

    /* ── Score pill ── */
    .ln-score {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(200,255,0,0.06); border: 1px solid rgba(200,255,0,0.18);
      border-radius: 12px; padding: 0.55rem 1rem; margin-bottom: 1rem;
    }
    .ln-score-label { font-size: 0.78rem; color: var(--ln-muted); font-weight: 500; }
    .ln-score-val { font-family: 'Familjen Grotesk', sans-serif; font-size: 1rem; font-weight: 800; color: var(--ln-lime); }

    /* ── Progress steps ── */
    .ln-steps {
      display: flex; align-items: center; gap: 6px; margin-bottom: 1.5rem;
    }
    .ln-step-dot {
      height: 4px; border-radius: 999px; flex: 1;
      transition: background 0.4s, opacity 0.4s;
    }
    .ln-step-dot.done    { background: var(--ln-lime); }
    .ln-step-dot.active  { background: rgba(200,255,0,0.5); }
    .ln-step-dot.pending { background: rgba(255,255,255,0.1); }

    /* ── Cards ── */
    .ln-card {
      background: var(--ln-card); border: 1px solid var(--ln-border);
      border-radius: 18px; padding: 1.25rem; margin-bottom: 0.85rem;
      position: relative; overflow: hidden;
    }
    .ln-card-label {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.12em; margin-bottom: 10px;
    }

    /* ── Setup ── */
    .ln-chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .ln-chip {
      padding: 0.45rem 0.9rem; border-radius: 10px; border: 1px solid transparent;
      font-size: 0.82rem; font-weight: 600; cursor: pointer;
      transition: all 0.15s; background: rgba(255,255,255,0.05); color: var(--ln-muted);
    }
    .ln-chip.active { background: var(--ln-lime); color: #000; border-color: var(--ln-lime); }
    .ln-chip:not(.active):hover { background: rgba(255,255,255,0.09); color: var(--ln-text); }

    .ln-env-chip {
      padding: 0.4rem 0.85rem; border-radius: 10px; border: 1px solid transparent;
      font-size: 0.8rem; font-weight: 600; cursor: pointer;
      transition: all 0.15s; background: rgba(255,255,255,0.05); color: var(--ln-muted);
    }
    .ln-env-chip.active {
      background: rgba(200,255,0,0.12); color: var(--ln-lime);
      border-color: rgba(200,255,0,0.3);
    }
    .ln-env-chip:not(.active):hover { background: rgba(255,255,255,0.08); }

    .ln-topic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; }
    .ln-topic-card {
      background: rgba(255,255,255,0.04); border: 1.5px solid var(--ln-border);
      border-radius: 14px; padding: 0.75rem 0.5rem;
      text-align: center; cursor: pointer; transition: all 0.18s;
    }
    .ln-topic-card:hover { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.07); }
    .ln-topic-card.selected {
      border-color: rgba(200,255,0,0.45); background: rgba(200,255,0,0.08);
    }
    .ln-topic-card.selected .ln-topic-name { color: var(--ln-lime); }
    .ln-topic-icon { font-size: 1.3rem; margin-bottom: 4px; }
    .ln-topic-name { font-size: 0.72rem; font-weight: 600; color: var(--ln-muted); }

    /* ── Summary bar ── */
    .ln-summary {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.03); border: 1px solid var(--ln-border);
      border-radius: 14px; padding: 0.85rem 1.1rem; margin-bottom: 0.85rem;
      font-size: 0.84rem;
    }
    .ln-summary span { color: var(--ln-muted); }
    .ln-summary strong { color: var(--ln-text); }

    /* ── Primary button ── */
    .ln-btn-primary {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--ln-lime); color: #000;
      border: none; border-radius: 13px; padding: 0.9rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.95rem; font-weight: 800; cursor: pointer;
      transition: all 0.2s; letter-spacing: 0.01em;
    }
    .ln-btn-primary:hover:not(:disabled) { background: #d8ff20; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(200,255,0,0.2); }
    .ln-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Ghost button ── */
    .ln-btn-ghost {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      background: rgba(255,255,255,0.05); color: var(--ln-text);
      border: 1px solid var(--ln-border); border-radius: 12px;
      padding: 0.75rem 1rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.85rem; font-weight: 700; cursor: pointer;
      transition: all 0.18s;
    }
    .ln-btn-ghost:hover { background: rgba(255,255,255,0.08); }

    /* ── Question card ── */
    .ln-question-box {
      background: linear-gradient(135deg, rgba(96,165,250,0.08) 0%, rgba(14,16,24,0) 60%);
      border: 1px solid rgba(96,165,250,0.2);
      border-radius: 18px; padding: 1.5rem; margin-bottom: 0.85rem;
      position: relative; overflow: hidden;
    }
    .ln-question-box::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(96,165,250,0.5), transparent);
    }
    .ln-question-tag {
      font-size: 0.65rem; font-weight: 700; color: var(--ln-blue);
      text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 12px;
      display: flex; align-items: center; gap: 5px;
    }
    .ln-question-text {
      font-size: 1.05rem; font-weight: 600; color: var(--ln-text); line-height: 1.75;
    }

    /* ── Answer input ── */
    .ln-textarea {
      width: 100%; background: rgba(255,255,255,0.04); border: 1.5px solid var(--ln-border);
      border-radius: 12px; padding: 0.85rem 1rem; resize: vertical; min-height: 90px;
      color: var(--ln-text); font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.9rem; line-height: 1.6; transition: border-color 0.18s;
      outline: none;
    }
    .ln-textarea:focus { border-color: rgba(200,255,0,0.35); }
    .ln-textarea::placeholder { color: rgba(220,225,255,0.2); }

    /* ── Self-assess buttons ── */
    .ln-assess-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
    .ln-btn-correct {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      background: rgba(34,197,94,0.1); color: var(--ln-green);
      border: 1.5px solid rgba(34,197,94,0.3); border-radius: 12px;
      padding: 0.8rem; font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.18s;
    }
    .ln-btn-correct:hover { background: rgba(34,197,94,0.18); border-color: rgba(34,197,94,0.5); transform: translateY(-1px); }
    .ln-btn-wrong {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      background: rgba(239,68,68,0.1); color: var(--ln-red);
      border: 1.5px solid rgba(239,68,68,0.25); border-radius: 12px;
      padding: 0.8rem; font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.18s;
    }
    .ln-btn-wrong:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.45); transform: translateY(-1px); }

    /* ── Result: Correct banner ── */
    .ln-correct-banner {
      background: linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 100%);
      border: 1.5px solid rgba(34,197,94,0.3); border-radius: 18px;
      padding: 1.25rem 1.4rem; margin-bottom: 0.85rem;
      position: relative; overflow: hidden;
    }
    .ln-correct-banner::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(34,197,94,0.6), transparent);
    }
    .ln-xp-bubble {
      background: rgba(200,255,0,0.12); border: 1px solid rgba(200,255,0,0.25);
      border-radius: 12px; padding: 0.5rem 0.9rem; text-align: center;
    }
    .ln-xp-num { font-family: 'Familjen Grotesk', sans-serif; font-size: 1.5rem; font-weight: 800; color: var(--ln-lime); line-height: 1; }
    .ln-xp-label { font-size: 0.6rem; color: var(--ln-muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }

    /* ── Explanation toggle ── */
    .ln-explain-toggle {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; background: rgba(96,165,250,0.06); border: 1px solid rgba(96,165,250,0.18);
      border-radius: 12px; padding: 0.75rem 1rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.84rem; font-weight: 700; color: var(--ln-blue);
      cursor: pointer; transition: all 0.18s; margin-bottom: 0.85rem;
    }
    .ln-explain-toggle:hover { background: rgba(96,165,250,0.1); }

    /* ── Wrong banner ── */
    .ln-wrong-banner {
      background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.03) 100%);
      border: 1.5px solid rgba(239,68,68,0.25); border-radius: 18px;
      padding: 1.1rem 1.25rem; margin-bottom: 0.85rem;
      position: relative; overflow: hidden;
    }
    .ln-wrong-banner::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent);
    }
    .ln-misconception {
      background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px; padding: 0.75rem; margin-top: 10px;
    }

    /* ── Remediation sections ── */
    .ln-rem-section { margin-bottom: 1rem; }
    .ln-rem-title {
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;
    }
    .ln-rem-body {
      color: var(--ln-muted); font-size: 0.88rem; line-height: 1.75;
    }
    .ln-example-box {
      background: rgba(249,115,22,0.07); border: 1px solid rgba(249,115,22,0.2);
      border-radius: 12px; padding: 0.9rem 1rem;
    }
    .ln-answer-reveal {
      background: rgba(34,197,94,0.08); border: 1.5px solid rgba(34,197,94,0.25);
      border-radius: 12px; padding: 0.9rem 1rem;
      font-size: 0.95rem; font-weight: 700; color: var(--ln-green);
    }
    .ln-steps-list { display: flex; flex-direction: column; gap: 8px; }
    .ln-step-item {
      display: flex; gap: 10px; align-items: flex-start;
    }
    .ln-step-num {
      flex-shrink: 0; width: 22px; height: 22px; border-radius: 7px;
      background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3);
      font-size: 0.65rem; font-weight: 800; color: var(--ln-amber);
      display: flex; align-items: center; justify-content: center; margin-top: 1px;
    }
    .ln-step-text { font-size: 0.86rem; color: var(--ln-muted); line-height: 1.65; }

    /* ── Stats row ── */
    .ln-stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
      margin-bottom: 0.85rem;
    }
    .ln-stat {
      background: rgba(255,255,255,0.03); border: 1px solid var(--ln-border);
      border-radius: 12px; padding: 0.65rem; text-align: center;
    }
    .ln-stat-val { font-family: 'Familjen Grotesk', sans-serif; font-size: 1.05rem; font-weight: 800; color: var(--ln-lime); }
    .ln-stat-key { font-size: 0.62rem; color: var(--ln-muted); font-weight: 600; margin-top: 1px; }

    /* ── Chips row ── */
    .ln-meta-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0.85rem; }
    .ln-meta-chip {
      font-size: 0.72rem; font-weight: 600; padding: 0.22rem 0.65rem;
      border-radius: 99px;
    }

    /* Fade-up animation */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .anim-up { animation: fadeUp 0.4s ease forwards; }
    .delay-1 { animation-delay: 0.07s; opacity: 0; }
    .delay-2 { animation-delay: 0.14s; opacity: 0; }
    .delay-3 { animation-delay: 0.21s; opacity: 0; }
    .delay-4 { animation-delay: 0.28s; opacity: 0; }
    .delay-5 { animation-delay: 0.35s; opacity: 0; }

    .ln-divider { height: 1px; background: var(--ln-border); margin: 0.85rem 0; }
  `}</style>
)

// ─── Framer variants ───────────────────────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, y: -12, transition: { duration: 0.22 } }
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function LearnPage() {
  const { user } = useAuth()

  // ── state ──────────────────────────────────────────────────────────────────
  const [step, setStep]               = useState(STEP.SETUP)
  const [classLevel, setClassLevel]   = useState(8)
  const [topic, setTopic]             = useState('')
  const [environment, setEnvironment] = useState('Cricket')
  const [content, setContent]         = useState(null)
  const [answer, setAnswer]           = useState('')
  const [isCorrect, setIsCorrect]     = useState(null)
  const [submitResult, setSubmitResult] = useState(null)
  const [remediation, setRemediation] = useState(null)

  const [loadingQ,   setLoadingQ]   = useState(false)
  const [loadingSub, setLoadingSub] = useState(false)
  const [loadingRem, setLoadingRem] = useState(false)

  // controls for optional explanation (correct path) and wrong reveal sections
  const [showExplanation, setShowExplanation] = useState(false)
  const [showConcept,     setShowConcept]     = useState(false)
  const [showExample,     setShowExample]     = useState(false)
  const [showSteps,       setShowSteps]       = useState(false)
  const [showAnswer,      setShowAnswer]      = useState(false)

  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 })

  const topics = TOPICS_BY_CLASS[classLevel] || []

  useEffect(() => {
    if (topics.length > 0 && !topics.includes(topic)) setTopic(topics[0])
  }, [classLevel])

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic) { toast.error('Select a topic first'); return }
    setLoadingQ(true)
    setAnswer(''); setContent(null); setSubmitResult(null)
    setRemediation(null); setIsCorrect(null)
    setShowExplanation(false); setShowConcept(false)
    setShowExample(false); setShowSteps(false); setShowAnswer(false)
    try {
      const res = await generateQuestion(user?.id || 'guest', topic, environment, classLevel)
      const parsed = typeof res.content === 'string' ? parseContent(res.content) : res.content
      setContent(parsed)
      setStep(STEP.QUESTION)
    } catch (e) {
      toast.error(e.message || 'Failed to generate question')
    } finally {
      setLoadingQ(false)
    }
  }

  // ── Submit (self-assessed) ─────────────────────────────────────────────────
  const handleSubmit = async (correct) => {
    setLoadingSub(true)
    setIsCorrect(correct)
    try {
      const res = await submitAnswer(topic, correct)
      setSubmitResult(res)
      setSessionScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
      setStep(STEP.RESULT)

      // Auto-fetch remediation only on wrong
      if (!correct) {
        setLoadingRem(true)
        try {
          const rem = await getRemediation(user?.id || 'guest', classLevel)
          setRemediation(rem)
        } catch {}
        setLoadingRem(false)
        // auto-open concept after a beat
        setTimeout(() => setShowConcept(true), 400)
      }
    } catch (e) {
      toast.error(e.message || 'Submit failed')
    } finally {
      setLoadingSub(false)
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    setStep(STEP.SETUP); setContent(null); setAnswer('')
    setRemediation(null); setIsCorrect(null)
  }
  const handleNextGenerate = () => {
    setContent(null); setAnswer('')
    setRemediation(null); setIsCorrect(null)
    handleGenerate()
  }

  // ── Step indicator ─────────────────────────────────────────────────────────
  const stepIndex = step === STEP.SETUP ? 0 : step === STEP.QUESTION ? 1 : 2
  const stepLabels = ['Setup', 'Question', 'Result']

  return (
    <AppLayout title="Learn">
      <GlobalStyles />
      <div className="ln-root" style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* ── Session score ── */}
        {sessionScore.total > 0 && (
          <div className="ln-score">
            <span className="ln-score-label">Session Score</span>
            <span className="ln-score-val">{sessionScore.correct} / {sessionScore.total}</span>
          </div>
        )}

        {/* ── Step progress dots ── */}
        <div className="ln-steps">
          {stepLabels.map((_, i) => (
            <div
              key={i}
              className={`ln-step-dot ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ════════════════ SETUP ════════════════ */}
          {step === STEP.SETUP && (
            <motion.div key="setup" variants={pageVariants} initial="hidden" animate="show" exit="exit">

              {/* Class level */}
              <div className="ln-card anim-up delay-1">
                <div className="ln-card-label" style={{ color: 'var(--ln-muted)' }}>Class Level</div>
                <div className="ln-chip-row">
                  {CLASS_LEVELS.map(c => (
                    <button key={c} className={`ln-chip ${classLevel === c ? 'active' : ''}`} onClick={() => setClassLevel(c)}>
                      Class {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic */}
              <div className="ln-card anim-up delay-2">
                <div className="ln-card-label" style={{ color: 'var(--ln-muted)' }}>Choose Topic</div>
                <div className="ln-topic-grid">
                  {topics.map(t => (
                    <div key={t} className={`ln-topic-card ${topic === t ? 'selected' : ''}`} onClick={() => setTopic(t)}>
                      <div className="ln-topic-icon">{getTopicIcon(t)}</div>
                      <div className="ln-topic-name">{t}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment */}
              <div className="ln-card anim-up delay-3">
                <div className="ln-card-label" style={{ color: 'var(--ln-muted)' }}>Learning Environment</div>
                <div className="ln-chip-row">
                  {ENVIRONMENTS.map(e => (
                    <button key={e.id} className={`ln-env-chip ${environment === e.id ? 'active' : ''}`} onClick={() => setEnvironment(e.id)}>
                      {e.emoji} {e.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="ln-summary anim-up delay-4">
                <span>
                  <strong>Class {classLevel}</strong> · <strong>{topic || '—'}</strong>
                </span>
                <span>{ENVIRONMENTS.find(e => e.id === environment)?.emoji} {environment}</span>
              </div>

              <button className="ln-btn-primary anim-up delay-5" onClick={handleGenerate} disabled={loadingQ || !topic}>
                {loadingQ
                  ? <><Spinner size={17} color="#000" /> Generating AI Question…</>
                  : <><Zap size={17} /> Generate AI Question</>
                }
              </button>
            </motion.div>
          )}

          {/* ════════════════ QUESTION ════════════════ */}
          {step === STEP.QUESTION && content && (
            <motion.div key="question" variants={pageVariants} initial="hidden" animate="show" exit="exit">

              {/* Meta chips */}
              <div className="ln-meta-chips">
                <span className="ln-meta-chip" style={{ background: 'rgba(200,255,0,0.1)', color: 'var(--ln-lime)' }}>Class {classLevel}</span>
                <span className="ln-meta-chip" style={{ background: 'rgba(96,165,250,0.1)', color: 'var(--ln-blue)' }}>{topic}</span>
                <span className="ln-meta-chip" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ln-muted)' }}>
                  {ENVIRONMENTS.find(e => e.id === environment)?.emoji} {environment}
                </span>
              </div>

              {/* Question box — only word_problem shown */}
              <div className="ln-question-box anim-up delay-1">
                <div className="ln-question-tag">
                  🧮 Practice Problem
                </div>
                <p className="ln-question-text">
                  {content.word_problem || 'Read the question and type your answer below.'}
                </p>
              </div>

              {/* Answer + self-assess */}
              <div className="ln-card anim-up delay-2">
                <div className="ln-card-label" style={{ color: 'var(--ln-muted)' }}>Your Answer</div>
                <textarea
                  className="ln-textarea"
                  rows={3}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Write your working and answer here…"
                />
                <div className="ln-assess-row">
                  <button className="ln-btn-correct" onClick={() => handleSubmit(true)} disabled={loadingSub}>
                    {loadingSub ? <Spinner size={15} /> : <CheckCircle size={16} />}
                    Got it right ✓
                  </button>
                  <button className="ln-btn-wrong" onClick={() => handleSubmit(false)} disabled={loadingSub}>
                    {loadingSub ? <Spinner size={15} /> : <XCircle size={16} />}
                    Got it wrong ✗
                  </button>
                </div>
              </div>

              <button className="ln-btn-ghost anim-up delay-3" onClick={handleNext} style={{ width: '100%' }}>
                ← Back to Setup
              </button>
            </motion.div>
          )}

          {/* ════════════════ RESULT ════════════════ */}
          {step === STEP.RESULT && (
            <motion.div key="result" variants={pageVariants} initial="hidden" animate="show" exit="exit">

              {/* ── PATH A: CORRECT ── */}
              {isCorrect && (
                <>
                  {/* Congrats banner */}
                  <motion.div
                    className="ln-correct-banner anim-up delay-1"
                    initial={{ scale: 0.94 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>🎉</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Familjen Grotesk', fontSize: '1.2rem', fontWeight: 800, color: 'var(--ln-green)', marginBottom: 3 }}>
                          Correct!
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--ln-muted)' }}>
                          {submitResult?.gamification
                            ? `Level ${submitResult.gamification.level} · ${submitResult.gamification.streak_days ?? 0} day streak`
                            : 'Great work, keep it up!'}
                        </div>
                      </div>
                      <div className="ln-xp-bubble">
                        <div className="ln-xp-num">+{submitResult?.gamification?.xp ?? 10}</div>
                        <div className="ln-xp-label">XP</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Optional: See Explanation toggle */}
                  <button className="ln-explain-toggle anim-up delay-2" onClick={() => setShowExplanation(v => !v)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <BookOpen size={15} /> Want to see the explanation?
                    </span>
                    {showExplanation ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  <AnimatePresence>
                    {showExplanation && content && (
                      <motion.div
                        key="expl"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden', marginBottom: '0.85rem' }}
                      >
                        <div className="ln-card">
                          {content.concept_explanation && (
                            <div className="ln-rem-section">
                              <div className="ln-rem-title" style={{ color: 'var(--ln-blue)' }}>
                                <BookOpen size={12} /> Concept
                              </div>
                              <p className="ln-rem-body">{content.concept_explanation}</p>
                            </div>
                          )}
                          {content.answer && (
                            <div className="ln-answer-reveal">
                              ✓ Answer: {content.answer}
                            </div>
                          )}
                          {content.step_by_step_solution?.length > 0 && (
                            <div className="ln-rem-section" style={{ marginTop: '1rem' }}>
                              <div className="ln-rem-title" style={{ color: 'var(--ln-amber)' }}>
                                <Lightbulb size={12} /> Step-by-step
                              </div>
                              <div className="ln-steps-list">
                                {content.step_by_step_solution.map((s, i) => (
                                  <div key={i} className="ln-step-item">
                                    <div className="ln-step-num">{i + 1}</div>
                                    <div className="ln-step-text">{s}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* ── PATH B: WRONG ── */}
              {!isCorrect && (
                <>
                  {/* Wrong banner */}
                  <motion.div
                    className="ln-wrong-banner anim-up delay-1"
                    initial={{ scale: 0.94 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: '2rem' }}>💪</div>
                      <div>
                        <div style={{ fontFamily: 'Familjen Grotesk', fontSize: '1rem', fontWeight: 800, color: 'var(--ln-red)', marginBottom: 2 }}>
                          Keep going!
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ln-muted)' }}>+2 XP for trying · Let's understand this together</div>
                      </div>
                    </div>
                    {submitResult?.misconception && (
                      <div className="ln-misconception">
                        <div style={{ fontSize: '0.65rem', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                          ⚠️ Misconception detected
                        </div>
                        <div style={{ fontSize: '0.83rem', color: '#fca5a5', fontWeight: 600 }}>
                          {submitResult.misconception}
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Loading remediation */}
                  {loadingRem && (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--ln-muted)', fontSize: '0.85rem' }}>
                      <Spinner size={22} />
                      <div style={{ marginTop: 8 }}>Generating personalized lesson…</div>
                    </div>
                  )}

                  {/* ── Concept Explanation (auto-opens) ── */}
                  {!loadingRem && (
                    <AnimatePresence>
                      {showConcept && content && (
                        <motion.div
                          key="concept"
                          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="ln-card" style={{ borderColor: 'rgba(96,165,250,0.2)', background: 'linear-gradient(135deg,rgba(96,165,250,0.07)0%,rgba(14,16,24,0)60%)' }}>
                            <div className="ln-rem-title" style={{ color: 'var(--ln-blue)', marginBottom: 10 }}>
                              <BookOpen size={13} /> Concept Explanation
                            </div>
                            <p className="ln-rem-body">
                              {remediation?.remediation_content?.concept_explanation || content.concept_explanation || '—'}
                            </p>

                            {/* Next: Show Example button */}
                            {!showExample && (
                              <button
                                className="ln-btn-ghost"
                                style={{ marginTop: '1rem', width: '100%' }}
                                onClick={() => setShowExample(true)}
                              >
                                <Lightbulb size={15} /> See Example <ArrowRight size={14} />
                              </button>
                            )}
                          </div>

                          {/* ── Example ── */}
                          <AnimatePresence>
                            {showExample && (
                              <motion.div
                                key="example"
                                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                              >
                                <div className="ln-card" style={{ borderColor: 'rgba(249,115,22,0.2)' }}>
                                  <div className="ln-rem-title" style={{ color: 'var(--ln-orange)' }}>
                                    <Lightbulb size={13} /> Worked Example
                                  </div>
                                  <div className="ln-example-box">
                                    <p className="ln-rem-body">
                                      {remediation?.remediation_content?.example || content.example || '—'}
                                    </p>
                                  </div>

                                  {!showSteps && (
                                    <button
                                      className="ln-btn-ghost"
                                      style={{ marginTop: '1rem', width: '100%' }}
                                      onClick={() => setShowSteps(true)}
                                    >
                                      <Sparkles size={15} /> Step-by-step Solution <ArrowRight size={14} />
                                    </button>
                                  )}
                                </div>

                                {/* ── Steps ── */}
                                <AnimatePresence>
                                  {showSteps && content.step_by_step_solution?.length > 0 && (
                                    <motion.div
                                      key="steps"
                                      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                      <div className="ln-card" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                                        <div className="ln-rem-title" style={{ color: 'var(--ln-amber)' }}>
                                          <Zap size={13} /> Step-by-step Solution
                                        </div>
                                        <div className="ln-steps-list">
                                          {content.step_by_step_solution.map((s, i) => (
                                            <div key={i} className="ln-step-item">
                                              <div className="ln-step-num">{i + 1}</div>
                                              <div className="ln-step-text">{s}</div>
                                            </div>
                                          ))}
                                        </div>

                                        {!showAnswer && (
                                          <button
                                            className="ln-btn-ghost"
                                            style={{ marginTop: '1rem', width: '100%', color: 'var(--ln-green)', borderColor: 'rgba(34,197,94,0.3)' }}
                                            onClick={() => setShowAnswer(true)}
                                          >
                                            <Eye size={15} /> Reveal Answer
                                          </button>
                                        )}
                                      </div>

                                      {/* ── Answer reveal ── */}
                                      <AnimatePresence>
                                        {showAnswer && content.answer && (
                                          <motion.div
                                            key="answer"
                                            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                                          >
                                            <div className="ln-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
                                              <div className="ln-rem-title" style={{ color: 'var(--ln-green)' }}>
                                                <CheckCircle size={13} /> Correct Answer
                                              </div>
                                              <div className="ln-answer-reveal">{content.answer}</div>
                                              {remediation?.recommendation?.recommendation && (
                                                <div style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--ln-muted)', fontStyle: 'italic' }}>
                                                  💬 {remediation.recommendation.recommendation}
                                                </div>
                                              )}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </>
              )}

              {/* ── Updated stats ── */}
              {submitResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.35 }}
                >
                  <div className="ln-stats">
                    {[
                      { label: 'XP',       val: submitResult.gamification?.xp ?? '—' },
                      { label: 'Level',    val: submitResult.gamification?.level ?? '—' },
                      { label: 'Streak',   val: `${submitResult.gamification?.streak_days ?? 0}d` },
                      { label: 'Accuracy', val: `${submitResult.performance?.accuracy ?? 0}%` },
                    ].map(s => (
                      <div key={s.label} className="ln-stat">
                        <div className="ln-stat-val">{s.val}</div>
                        <div className="ln-stat-key">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Action buttons ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button className="ln-btn-ghost" onClick={handleNext}>
                  <RotateCcw size={15} /> New Setup
                </button>
                <button className="ln-btn-primary" onClick={handleNextGenerate} disabled={loadingQ} style={{ borderRadius: 12, padding: '0.75rem' }}>
                  {loadingQ ? <Spinner size={16} color="#000" /> : <RefreshCw size={15} />}
                  Next Question
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AppLayout>
  )
}