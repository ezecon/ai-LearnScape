'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, RefreshCw, CheckCircle, XCircle,
  Lightbulb, BookOpen, ArrowRight, RotateCcw,
  Eye, Sparkles, ChevronDown, Brain
} from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import AppLayout from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui'
import { generateQuestion, submitAnswer, getRemediation, saveQuestionHistory, updateQuestionHistory } from '@/services/api'
import { useAuth } from '@/lib/AuthContext'
import { TOPICS_BY_CLASS, ENVIRONMENTS, CLASS_LEVELS, getTopicIcon } from '@/lib/curriculum'
import toast from 'react-hot-toast'

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEP = { SETUP: 'setup', CONCEPT: 'concept', QUESTION: 'question', RESULT: 'result' }

// ─── Parse API string response ────────────────────────────────────────────────
function parseContent(raw) {
  if (typeof raw !== 'string') return raw

  // Debug — remove after fix confirmed
  console.log('RAW CONTENT:', raw.slice(0, 300))

  // Clean markdown bold/italic
  const clean = raw
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')

  // Strategy 1: ### Header format
  const getSection = (label, nextLabel) => {
    const esc = s => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    const pattern = nextLabel
      ? new RegExp(`###?\\s*${esc(label)}[:\\s]*([\\s\\S]*?)(?=###|$)`, 'i')
      : new RegExp(`###?\\s*${esc(label)}[:\\s]*([\\s\\S]*)$`, 'i')
    const m = clean.match(pattern)
    return m ? m[1].trim() : ''
  }

  // Strategy 2: Plain "Label:" format (no ###)
  const getPlain = (label, nextLabel) => {
    const esc = s => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    const pattern = nextLabel
      ? new RegExp(`${esc(label)}\\s*:?\\s*([\\s\\S]*?)(?=${esc(nextLabel)}\\s*:|$)`, 'i')
      : new RegExp(`${esc(label)}\\s*:?\\s*([\\s\\S]*)$`, 'i')
    const m = clean.match(pattern)
    return m ? m[1].trim() : ''
  }

  // Try ### format first, fallback to plain
  const get = (label, next) => {
    const s1 = getSection(label, next)
    if (s1) return s1
    return getPlain(label, next)
  }

  const concept     = get('Concept Explanation', 'Example')
  const example     = get('Example', 'Word Problem')
  const wordProblem = get('Word Problem', 'Answer')
  const answer      = get('Answer', 'Step-by-Step Solution') || get('Answer', 'Step')
  const stepsRaw    = get('Step-by-Step Solution', '')

  console.log('PARSED:', { concept: concept.slice(0,50), wordProblem: wordProblem.slice(0,50), answer })

  return {
    concept_explanation: concept,
    example,
    word_problem: wordProblem,
    answer,
    step_by_step_solution: stepsRaw
      .split('\n')
      .filter(l => l.trim())
      .map(l => l.replace(/^\s*\d+\.\s*|^[-*•]\s*/, '').trim())
      .filter(Boolean),
  }
}

// ─── Extract numeric value from answer (handles LaTeX fractions) ──────────────
function extractAnswerValue(s) {
  const str = String(s ?? '')

  // LaTeX fraction: \frac{3}{5} → 3/5 → 0.6
  const latexFrac = str.match(/\\frac\{(\d+)\}\{(\d+)\}/)
  if (latexFrac) return parseFloat(latexFrac[1]) / parseFloat(latexFrac[2])

  // Plain fraction: 3/5
  const plainFrac = str.match(/(\d+)\s*\/\s*(\d+)/)
  if (plainFrac) return parseFloat(plainFrac[1]) / parseFloat(plainFrac[2])

  // Dollar-sign wrapped: $3/5$ or $\frac{3}{5}$
  const dollarFrac = str.match(/\$\\frac\{(\d+)\}\{(\d+)\}\$/)
  if (dollarFrac) return parseFloat(dollarFrac[1]) / parseFloat(dollarFrac[2])

  // Plain number
  const num = str.match(/[\d.]+/)
  if (num) return parseFloat(num[0])

  return null
}

// ─── Smart answer checker ─────────────────────────────────────────────────────
function checkAnswerWithAI(question, correctAnswer, studentAnswer) {
  const norm = s => String(s ?? '').toLowerCase().trim().replace(/\s+/g, ' ')

  const correct = norm(correctAnswer)
  const student = norm(studentAnswer)

  // 1. Exact normalized match
  if (correct === student) return { is_correct: true, feedback: 'Spot on! Perfect answer.' }

  // 2. Strip non-alphanumeric
  const strip = s => s.replace(/[^a-z0-9]/g, '')
  if (strip(correct) === strip(student)) return { is_correct: true, feedback: 'Correct! Well done.' }

  // 3. Numeric/fraction comparison (handles LaTeX, fractions, decimals)
  const correctVal = extractAnswerValue(correctAnswer)
  const studentVal = extractAnswerValue(studentAnswer)
  if (correctVal !== null && studentVal !== null) {
    if (Math.abs(correctVal - studentVal) < 0.011) {
      return { is_correct: true, feedback: 'Great job, your answer is correct!' }
    }
  }

  // 4. Key word match (for text answers)
  const correctWords = correct.split(' ').filter(w => w.length > 3)
  const studentWords = student.split(' ')
  if (correctWords.length > 0) {
    const matchCount = correctWords.filter(w =>
      studentWords.some(sw => sw.includes(w) || w.includes(sw))
    ).length
    if (matchCount / correctWords.length >= 0.75) return { is_correct: true, feedback: 'Correct! Nice work.' }
  }

  return { is_correct: false, feedback: "Not quite — let's work through it together." }
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Familjen+Grotesk:wght@700;800;900&display=swap');

    :root {
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
      --ln-purple: #a78bfa;
    }

    .ln-root { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--ln-text); }

    /* Score */
    .ln-score {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(200,255,0,0.05); border: 1px solid rgba(200,255,0,0.15);
      border-radius: 12px; padding: 0.5rem 1rem; margin-bottom: 1rem;
    }
    .ln-score-label { font-size: 0.75rem; color: var(--ln-muted); font-weight: 500; }
    .ln-score-val { font-family: 'Familjen Grotesk', sans-serif; font-size: 1rem; font-weight: 800; color: var(--ln-lime); }

    /* Progress bar */
    .ln-progress { display: flex; gap: 5px; margin-bottom: 1.5rem; }
    .ln-progress-seg { height: 3px; flex: 1; border-radius: 99px; transition: background 0.4s; }
    .ln-progress-seg.done    { background: var(--ln-lime); }
    .ln-progress-seg.active  { background: rgba(200,255,0,0.45); }
    .ln-progress-seg.pending { background: rgba(255,255,255,0.08); }

    /* Card */
    .ln-card {
      background: var(--ln-card); border: 1px solid var(--ln-border);
      border-radius: 18px; padding: 1.25rem; margin-bottom: 0.85rem;
      position: relative; overflow: hidden;
    }
    .ln-card-title {
      font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.13em; margin-bottom: 12px; color: var(--ln-muted);
    }

    /* Chips */
    .ln-chip-row { display: flex; gap: 7px; flex-wrap: wrap; }
    .ln-chip {
      padding: 0.42rem 0.85rem; border-radius: 10px;
      border: 1px solid transparent; font-size: 0.81rem; font-weight: 600;
      cursor: pointer; transition: all 0.15s;
      background: rgba(255,255,255,0.05); color: var(--ln-muted);
    }
    .ln-chip.active { background: var(--ln-lime); color: #000; }
    .ln-chip:not(.active):hover { background: rgba(255,255,255,0.09); color: var(--ln-text); }

    .ln-env-chip {
      padding: 0.38rem 0.8rem; border-radius: 10px;
      border: 1px solid transparent; font-size: 0.79rem; font-weight: 600;
      cursor: pointer; transition: all 0.15s;
      background: rgba(255,255,255,0.05); color: var(--ln-muted);
    }
    .ln-env-chip.active { background: rgba(200,255,0,0.1); color: var(--ln-lime); border-color: rgba(200,255,0,0.28); }
    .ln-env-chip:not(.active):hover { background: rgba(255,255,255,0.07); }

    /* Topic grid */
    .ln-topic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(98px, 1fr)); gap: 8px; }
    .ln-topic-card {
      background: rgba(255,255,255,0.04); border: 1.5px solid var(--ln-border);
      border-radius: 14px; padding: 0.7rem 0.45rem;
      text-align: center; cursor: pointer; transition: all 0.18s;
    }
    .ln-topic-card:hover { border-color: rgba(255,255,255,0.13); background: rgba(255,255,255,0.06); }
    .ln-topic-card.selected { border-color: rgba(200,255,0,0.4); background: rgba(200,255,0,0.07); }
    .ln-topic-card.selected .ln-topic-name { color: var(--ln-lime); }
    .ln-topic-icon { font-size: 1.25rem; margin-bottom: 5px; }
    .ln-topic-name { font-size: 0.7rem; font-weight: 600; color: var(--ln-muted); }

    /* Summary */
    .ln-summary {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.03); border: 1px solid var(--ln-border);
      border-radius: 13px; padding: 0.8rem 1rem; margin-bottom: 0.85rem; font-size: 0.83rem;
    }

    /* Buttons */
    .ln-btn {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      border-radius: 12px; padding: 0.82rem 1.1rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.18s; border: none;
    }
    .ln-btn-lime { background: var(--ln-lime); color: #000; width: 100%; }
    .ln-btn-lime:hover:not(:disabled) { background: #d9ff20; transform: translateY(-2px); box-shadow: 0 8px 22px rgba(200,255,0,0.2); }
    .ln-btn-lime:disabled { opacity: 0.45; cursor: not-allowed; }
    .ln-btn-ghost {
      background: rgba(255,255,255,0.05); color: var(--ln-text);
      border: 1px solid var(--ln-border); width: 100%;
    }
    .ln-btn-ghost:hover { background: rgba(255,255,255,0.09); }

    /* Question box */
    .ln-qbox {
      background: linear-gradient(135deg, rgba(96,165,250,0.08), rgba(14,16,24,0) 65%);
      border: 1px solid rgba(96,165,250,0.22); border-radius: 18px;
      padding: 1.4rem; margin-bottom: 0.85rem; position: relative; overflow: hidden;
    }
    .ln-qbox::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(96,165,250,0.5), transparent);
    }
    .ln-qtag {
      font-size: 0.62rem; font-weight: 700; color: var(--ln-blue);
      text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px;
      display: flex; align-items: center; gap: 5px;
    }
    .ln-qtext { font-size: 1.02rem; font-weight: 600; color: var(--ln-text); line-height: 1.75; }

    /* Textarea */
    .ln-textarea {
      width: 100%; background: rgba(255,255,255,0.04); border: 1.5px solid var(--ln-border);
      border-radius: 12px; padding: 0.85rem 1rem; resize: vertical; min-height: 88px;
      color: var(--ln-text); font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.9rem; line-height: 1.6; transition: border-color 0.18s; outline: none;
    }
    .ln-textarea:focus { border-color: rgba(200,255,0,0.35); }
    .ln-textarea::placeholder { color: rgba(220,225,255,0.18); }
    .ln-textarea:disabled { opacity: 0.55; cursor: not-allowed; }

    /* AI checking state */
    .ln-checking {
      display: flex; align-items: center; gap: 10px;
      background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.2);
      border-radius: 12px; padding: 0.85rem 1rem; margin-top: 10px;
      font-size: 0.84rem; color: var(--ln-purple); font-weight: 600;
    }

    /* Result banners */
    .ln-banner-correct {
      background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.03) 70%);
      border: 1.5px solid rgba(34,197,94,0.3); border-radius: 18px;
      padding: 1.2rem 1.35rem; margin-bottom: 0.85rem; position: relative; overflow: hidden;
    }
    .ln-banner-correct::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(34,197,94,0.6), transparent);
    }
    .ln-banner-wrong {
      background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03) 70%);
      border: 1.5px solid rgba(239,68,68,0.25); border-radius: 18px;
      padding: 1.1rem 1.2rem; margin-bottom: 0.85rem; position: relative; overflow: hidden;
    }
    .ln-banner-wrong::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent);
    }

    .ln-xp-pill {
      background: rgba(200,255,0,0.12); border: 1px solid rgba(200,255,0,0.22);
      border-radius: 11px; padding: 0.45rem 0.85rem; text-align: center; flex-shrink: 0;
    }
    .ln-xp-num { font-family: 'Familjen Grotesk', sans-serif; font-size: 1.4rem; font-weight: 900; color: var(--ln-lime); line-height: 1; }
    .ln-xp-lbl { font-size: 0.58rem; color: var(--ln-muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }

    .ln-misconception {
      background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.18);
      border-radius: 10px; padding: 0.7rem; margin-top: 10px;
    }

    /* Reveal sections */
    .ln-reveal-card {
      border-radius: 16px; padding: 1.1rem; margin-bottom: 0.85rem;
      border: 1px solid var(--ln-border); background: var(--ln-card);
    }
    .ln-reveal-title {
      font-size: 0.63rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.11em; margin-bottom: 10px;
      display: flex; align-items: center; gap: 5px;
    }
    .ln-reveal-body { color: var(--ln-muted); font-size: 0.87rem; line-height: 1.75; }

    .ln-example-box {
      background: rgba(249,115,22,0.07); border: 1px solid rgba(249,115,22,0.18);
      border-radius: 11px; padding: 0.85rem;
    }
    .ln-answer-box {
      background: rgba(34,197,94,0.08); border: 1.5px solid rgba(34,197,94,0.25);
      border-radius: 11px; padding: 0.85rem;
      font-size: 0.93rem; font-weight: 700; color: var(--ln-green);
    }

    .ln-steps-list { display: flex; flex-direction: column; gap: 8px; }
    .ln-step-row { display: flex; gap: 10px; align-items: flex-start; }
    .ln-step-badge {
      flex-shrink: 0; width: 21px; height: 21px; border-radius: 7px;
      background: rgba(245,158,11,0.14); border: 1px solid rgba(245,158,11,0.28);
      font-size: 0.62rem; font-weight: 800; color: var(--ln-amber);
      display: flex; align-items: center; justify-content: center; margin-top: 1px;
    }
    .ln-step-text { font-size: 0.85rem; color: var(--ln-muted); line-height: 1.65; }

    /* Explanation toggle (correct path) */
    .ln-toggle-btn {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; background: rgba(96,165,250,0.05); border: 1px solid rgba(96,165,250,0.16);
      border-radius: 12px; padding: 0.72rem 1rem; margin-bottom: 0.85rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.83rem; font-weight: 700; color: var(--ln-blue);
      cursor: pointer; transition: background 0.18s;
    }
    .ln-toggle-btn:hover { background: rgba(96,165,250,0.09); }

    /* Stats */
    .ln-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 0.85rem; }
    .ln-stat { background: rgba(255,255,255,0.03); border: 1px solid var(--ln-border); border-radius: 12px; padding: 0.6rem; text-align: center; }
    .ln-stat-val { font-family: 'Familjen Grotesk', sans-serif; font-size: 1rem; font-weight: 800; color: var(--ln-lime); }
    .ln-stat-key { font-size: 0.6rem; color: var(--ln-muted); font-weight: 600; margin-top: 1px; }

    /* Meta chips */
    .ln-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0.85rem; }
    .ln-meta-chip { font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.62rem; border-radius: 99px; }

    /* Concept choice cards */
    .ln-choice-card {
      display: flex; align-items: center; gap: 12px;
      background: var(--ln-card); border: 1.5px solid var(--ln-border);
      border-radius: 16px; padding: 1rem 1.1rem; margin-bottom: 0.85rem;
      cursor: pointer; transition: all 0.18s; width: 100%; text-align: left;
    }
    .ln-choice-card:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-1px); }
    .ln-choice-card.active { border-color: rgba(200,255,0,0.35); background: rgba(200,255,0,0.05); }
    .ln-choice-icon {
      width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .au  { animation: fadeUp 0.38s ease forwards; }
    .d1  { animation-delay: 0.06s; opacity: 0; }
    .d2  { animation-delay: 0.12s; opacity: 0; }
    .d3  { animation-delay: 0.18s; opacity: 0; }
    .d4  { animation-delay: 0.24s; opacity: 0; }
    .d5  { animation-delay: 0.30s; opacity: 0; }
  `}</style>
)

const pv = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, y: -10, transition: { duration: 0.2 } }
}
const slideUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const [historyId, setHistoryId] = useState(null)
  const [step, setStep]               = useState(STEP.SETUP)
  const [classLevel, setClassLevel]   = useState(8)
  const [topic, setTopic]             = useState('')
  const [environment, setEnvironment] = useState('Cricket')
  const [content, setContent]         = useState(null)
  const [answer, setAnswer]           = useState('')
  const [isCorrect, setIsCorrect]     = useState(null)
  const [aiFeedback, setAiFeedback]   = useState('')
  const [submitResult, setSubmitResult] = useState(null)
  const [remediation, setRemediation] = useState(null)

  const [loadingQ,      setLoadingQ]      = useState(false)
  const [loadingCheck,  setLoadingCheck]  = useState(false)  // AI checking
  const [loadingSub,    setLoadingSub]    = useState(false)
  const [loadingRem,    setLoadingRem]    = useState(false)

  const [conceptShown,    setConceptShown]    = useState(false) // did they view concept?
  const [showExplanation, setShowExplanation] = useState(false) // correct path toggle
  const [showExample,     setShowExample]     = useState(false)
  const [showSteps,       setShowSteps]       = useState(false)
  const [showAnswer,      setShowAnswer]      = useState(false)

  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 })

  const topics = TOPICS_BY_CLASS[classLevel] || []
  useEffect(() => {
    if (topics.length > 0 && !topics.includes(topic)) setTopic(topics[0])
  }, [classLevel])

  // ── Reset all state ─────────────────────────────────────────────────────────
  const resetAll = () => {
    setAnswer(''); setContent(null); setSubmitResult(null)
    setRemediation(null); setIsCorrect(null); setAiFeedback('')
    setConceptShown(false); setShowExplanation(false)
    setShowExample(false); setShowSteps(false); setShowAnswer(false)
  }

  // ── Generate question ───────────────────────────────────────────────────────
const handleGenerate = async () => {
  console.log("CLICKED")
  if (!topic) { toast.error('Select a topic first'); return }
  setLoadingQ(true)
  resetAll()
  try {
    const res = await generateQuestion(user?.id || 'guest', topic, environment, classLevel, lang)
    const parsed = typeof res.content === 'string' ? parseContent(res.content) : res.content
    setContent(parsed)
    setStep(STEP.CONCEPT)

    // ← এখানে history save
    try {
      const saved = await saveQuestionHistory({
        topic,
        environment,
        class_level: classLevel,
        question: parsed?.word_problem || '',
        correct_answer: parsed?.answer || '',
        student_answer: null,
        is_correct: 'pending',
        full_content: JSON.stringify(parsed)
      })
      if (saved?.id) setHistoryId(saved.id)
    } catch (e) {
      console.error('History save failed:', e)
    }

  } catch (e) {
    toast.error(e.message || 'Failed to generate question')
  } finally {
    setLoadingQ(false)
  }
}

  // ── Submit: check answer then call backend ─────────────────────────────────
  const handleSubmit = async () => {
    if (!answer.trim()) { toast.error('Write your answer first'); return }

    setLoadingSub(true)
    try {
      // 1. Client-side smart check (synchronous)
      const { is_correct, feedback } = checkAnswerWithAI(
        content?.word_problem,
        content?.answer,
        answer
      )
      setIsCorrect(is_correct)
      setAiFeedback(feedback)

      // 2. Tell backend
      const res = await submitAnswer(topic, is_correct)
      setSubmitResult(res)
      setSessionScore(s => ({ correct: s.correct + (is_correct ? 1 : 0), total: s.total + 1 }))
      setStep(STEP.RESULT)
      // history update
      if (historyId) {
        try {
          await updateQuestionHistory(historyId, answer, String(is_correct))
        } catch (e) {
          console.error('History update failed:', e)
        }
      }
      // 3. If wrong → fetch remediation in background
      if (!is_correct) {
        setLoadingRem(true)
        try {
          const rem = await getRemediation(user?.id || 'guest', classLevel)
          setRemediation(rem)
        } catch {}
        setLoadingRem(false)
      }
    } catch (e) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setLoadingSub(false)
    }
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleNewSetup = () => { resetAll(); setStep(STEP.SETUP) }
  const handleNextQ    = () => { resetAll(); handleGenerate() }

  const stepIndex = { [STEP.SETUP]: 0, [STEP.CONCEPT]: 1, [STEP.QUESTION]: 2, [STEP.RESULT]: 3 }[step] ?? 0
  const env = ENVIRONMENTS.find(e => e.id === environment)

  return (
    <AppLayout title="Learn">
      <GlobalStyles />
      <div className="ln-root" style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Session score */}
        {sessionScore.total > 0 && (
          <div className="ln-score">
            <span className="ln-score-label">Session Score</span>
            <span className="ln-score-val">{sessionScore.correct} / {sessionScore.total}</span>
          </div>
        )}

        {/* Progress */}
        <div className="ln-progress">
          {['Setup','Concept','Question','Result'].map((_, i) => (
            <div key={i} className={`ln-progress-seg ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ══════════ SETUP ══════════ */}
          {step === STEP.SETUP && (
            <motion.div key="setup" variants={pv} initial="hidden" animate="show" exit="exit">

              <div className="ln-card au d1">
                <div className="ln-card-title">Class Level</div>
                <div className="ln-chip-row">
                  {CLASS_LEVELS.map(c => (
                    <button key={c} className={`ln-chip ${classLevel === c ? 'active' : ''}`} onClick={() => setClassLevel(c)}>
                      Class {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ln-card au d2">
                <div className="ln-card-title">Choose Topic</div>
                <div className="ln-topic-grid">
                  {topics.map(t => (
                    <div key={t} className={`ln-topic-card ${topic === t ? 'selected' : ''}`} onClick={() => setTopic(t)}>
                      <div className="ln-topic-icon">{getTopicIcon(t)}</div>
                      <div className="ln-topic-name">{t}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ln-card au d3">
                <div className="ln-card-title">Learning Environment</div>
                <div className="ln-chip-row">
                  {ENVIRONMENTS.map(e => (
                    <button key={e.id} className={`ln-env-chip ${environment === e.id ? 'active' : ''}`} onClick={() => setEnvironment(e.id)}>
                      {e.emoji} {e.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ln-summary au d4">
                <span style={{ color: 'var(--ln-muted)' }}>
                  <strong style={{ color: 'var(--ln-text)' }}>Class {classLevel}</strong>
                  {' · '}
                  <strong style={{ color: 'var(--ln-text)' }}>{topic || '—'}</strong>
                </span>
                <span style={{ color: 'var(--ln-muted)' }}>{env?.emoji} {environment}</span>
              </div>

              <button className="ln-btn ln-btn-lime au d5" onClick={handleGenerate} disabled={loadingQ || !topic}>
                {loadingQ ? <><Spinner size={16} color="#000" /> Generating…</> : <><Zap size={16} /> Generate AI Question</>}
              </button>

              {/* Loading overlay inside SETUP */}
              {loadingQ && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 50,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(6,7,13,0.85)', backdropFilter: 'blur(6px)',
                  gap: 14
                }}>
                  <Spinner size={32} />
                  <p style={{ color: 'var(--ln-muted)', fontSize: '0.88rem', fontWeight: 500 }}>
                    Generating your AI question…
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════ CONCEPT CHOICE ══════════ */}
          {step === STEP.CONCEPT && (
            <motion.div key="concept" variants={pv} initial="hidden" animate="show" exit="exit">

              {/* Meta */}
              <div className="ln-meta">
                <span className="ln-meta-chip" style={{ background: 'rgba(200,255,0,0.1)', color: 'var(--ln-lime)' }}>Class {classLevel}</span>
                <span className="ln-meta-chip" style={{ background: 'rgba(96,165,250,0.1)', color: 'var(--ln-blue)' }}>{topic}</span>
                <span className="ln-meta-chip" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ln-muted)' }}>{env?.emoji} {environment}</span>
              </div>

              {/* Ready card */}
              <div className="ln-card au d1" style={{
                textAlign: 'center', padding: '1.75rem 1.25rem',
                borderColor: 'rgba(200,255,0,0.12)',
                background: 'linear-gradient(135deg,rgba(200,255,0,0.04),rgba(14,16,24,0) 70%)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>🚀</div>
                <div style={{ fontFamily: 'Familjen Grotesk', fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Question is ready!
                </div>
                <p style={{ color: 'var(--ln-muted)', fontSize: '0.83rem', lineHeight: 1.6 }}>
                  Want to brush up on the concept first, or dive straight in?
                </p>
              </div>

              {/* Option A: Show Concept */}
              <button
                className={`ln-choice-card au d2 ${conceptShown ? 'active' : ''}`}
                onClick={() => setConceptShown(v => !v)}
              >
                <div className="ln-choice-icon" style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)' }}>
                  <BookOpen size={18} color="var(--ln-blue)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>Review Concept First</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--ln-muted)' }}>See the explanation & example before attempting</div>
                </div>
                <ChevronDown size={15} color="var(--ln-blue)" style={{ transform: conceptShown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Concept content (expands) */}
              <AnimatePresence>
                {conceptShown && content && (
                  <motion.div key="cexp" variants={slideUp} initial="hidden" animate="show" exit={{ opacity: 0, height: 0 }}>
                    <div className="ln-reveal-card" style={{ borderColor: 'rgba(96,165,250,0.2)', background: 'linear-gradient(135deg,rgba(96,165,250,0.06),rgba(14,16,24,0) 65%)' }}>
                      <div className="ln-reveal-title" style={{ color: 'var(--ln-blue)' }}>
                        <BookOpen size={12} /> Concept Explanation
                      </div>
                      <p className="ln-reveal-body">{content?.concept_explanation || '—'}</p>

                      {content?.example && (
                        <div className="ln-example-box" style={{ marginTop: '0.9rem' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--ln-orange)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Lightbulb size={11} /> Example
                          </div>
                          <p className="ln-reveal-body">{content?.example}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Go to question */}
              <button className="ln-btn ln-btn-lime au d3" onClick={() => setStep(STEP.QUESTION)}>
                <ArrowRight size={16} />
                {conceptShown ? "I'm ready — Try the Question" : "Jump Straight to Question"}
              </button>

              <button className="ln-btn ln-btn-ghost" style={{ marginTop: 8 }} onClick={handleNewSetup}>
                ← Back to Setup
              </button>
            </motion.div>
          )}

          {/* ══════════ QUESTION ══════════ */}
          {step === STEP.QUESTION && (
            <motion.div key="question" variants={pv} initial="hidden" animate="show" exit="exit">

              {/* Meta */}
              <div className="ln-meta">
                <span className="ln-meta-chip" style={{ background: 'rgba(200,255,0,0.1)', color: 'var(--ln-lime)' }}>Class {classLevel}</span>
                <span className="ln-meta-chip" style={{ background: 'rgba(96,165,250,0.1)', color: 'var(--ln-blue)' }}>{topic}</span>
                <span className="ln-meta-chip" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ln-muted)' }}>{env?.emoji} {environment}</span>
              </div>

              {/* Question */}
              <div className="ln-qbox au d1">
                <div className="ln-qtag">🧮 Practice Problem</div>
                <p className="ln-qtext">{content?.word_problem || '—'}</p>
              </div>

              {/* Answer */}
              <div className="ln-card au d2">
                <div className="ln-card-title">Your Answer</div>
                <textarea
                  className="ln-textarea"
                  rows={3}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Write your working and answer here…"
                  disabled={loadingSub}
                />

                {/* Submitting indicator */}
                {loadingSub && (
                  <div className="ln-checking">
                    <Spinner size={16} color="var(--ln-purple)" />
                    Checking your answer…
                  </div>
                )}

                {/* Submit button */}
                {!loadingSub && (
                  <button
                    className="ln-btn ln-btn-lime"
                    style={{ marginTop: 10, borderRadius: 12, padding: '0.8rem' }}
                    onClick={handleSubmit}
                  >
                    <Brain size={16} /> Submit Answer
                  </button>
                )}
              </div>

              <button className="ln-btn ln-btn-ghost" onClick={() => setStep(STEP.CONCEPT)}>
                ← Back
              </button>
            </motion.div>
          )}

          {/* ══════════ RESULT ══════════ */}
          {step === STEP.RESULT && (
            <motion.div key="result" variants={pv} initial="hidden" animate="show" exit="exit">

              {/* ── CORRECT ── */}
              {isCorrect && (
                <>
                  <motion.div className="ln-banner-correct" initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>🎉</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Familjen Grotesk', fontSize: '1.15rem', fontWeight: 800, color: 'var(--ln-green)', marginBottom: 3 }}>Correct!</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--ln-muted)' }}>
                          {aiFeedback || (submitResult?.gamification ? `Level ${submitResult.gamification.level} · ${submitResult.gamification.streak_days ?? 0} day streak` : 'Great work!')}
                        </div>
                      </div>
                      <div className="ln-xp-pill">
                        <div className="ln-xp-num">+{submitResult?.gamification?.xp ?? 10}</div>
                        <div className="ln-xp-lbl">XP</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Optional explanation */}
                  <button className="ln-toggle-btn" onClick={() => setShowExplanation(v => !v)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={14} /> See full explanation
                    </span>
                    <ChevronDown size={14} style={{ transform: showExplanation ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  <AnimatePresence>
                    {showExplanation && content && (
                      <motion.div key="expl" variants={slideUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                        <div className="ln-reveal-card" style={{ borderColor: 'rgba(96,165,250,0.18)' }}>
                          {content?.concept_explanation && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div className="ln-reveal-title" style={{ color: 'var(--ln-blue)' }}><BookOpen size={12} /> Concept</div>
                              <p className="ln-reveal-body">{content?.concept_explanation}</p>
                            </div>
                          )}
                          {content?.step_by_step_solution?.length > 0 && (
                            <div>
                              <div className="ln-reveal-title" style={{ color: 'var(--ln-amber)' }}><Sparkles size={12} /> Step-by-step</div>
                              <div className="ln-steps-list">
                                {content?.step_by_step_solution?.map((s, i) => (
                                  <div key={i} className="ln-step-row">
                                    <div className="ln-step-badge">{i + 1}</div>
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

              {/* ── WRONG ── */}
              {!isCorrect && (
                <>
                  <motion.div className="ln-banner-wrong" initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: '1.9rem' }}>💪</div>
                      <div>
                        <div style={{ fontFamily: 'Familjen Grotesk', fontSize: '1rem', fontWeight: 800, color: 'var(--ln-red)', marginBottom: 2 }}>Not quite!</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ln-muted)' }}>
                          {aiFeedback || "+2 XP for trying · Let's work through it together"}
                        </div>
                      </div>
                    </div>
                    {submitResult?.misconception && (
                      <div className="ln-misconception">
                        <div style={{ fontSize: '0.62rem', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>⚠️ Misconception detected</div>
                        <div style={{ fontSize: '0.82rem', color: '#fca5a5', fontWeight: 600 }}>{submitResult.misconception}</div>
                      </div>
                    )}
                  </motion.div>

                  {/* Remediation loading */}
                  {loadingRem && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem', color: 'var(--ln-muted)', fontSize: '0.83rem' }}>
                      <Spinner size={18} /> Loading personalized lesson…
                    </div>
                  )}

                  {/* Concept */}
                  {!loadingRem && (
                    <motion.div variants={slideUp} initial="hidden" animate="show">
                      <div className="ln-reveal-card" style={{ borderColor: 'rgba(96,165,250,0.2)', background: 'linear-gradient(135deg,rgba(96,165,250,0.06),rgba(14,16,24,0) 65%)' }}>
                        <div className="ln-reveal-title" style={{ color: 'var(--ln-blue)' }}><BookOpen size={12} /> Concept Explanation</div>
                        <p className="ln-reveal-body">
                          {remediation?.remediation_content?.concept_explanation || content?.concept_explanation || '—'}
                        </p>

                        {!showExample && (
                          <button className="ln-btn ln-btn-ghost" style={{ marginTop: '0.9rem' }} onClick={() => setShowExample(true)}>
                            <Lightbulb size={14} /> See Worked Example <ArrowRight size={13} />
                          </button>
                        )}
                      </div>

                      {/* Example */}
                      <AnimatePresence>
                        {showExample && (
                          <motion.div key="ex" variants={slideUp} initial="hidden" animate="show">
                            <div className="ln-reveal-card" style={{ borderColor: 'rgba(249,115,22,0.2)' }}>
                              <div className="ln-reveal-title" style={{ color: 'var(--ln-orange)' }}><Lightbulb size={12} /> Worked Example</div>
                              <div className="ln-example-box">
                                <p className="ln-reveal-body">{remediation?.remediation_content?.example || content?.example || '—'}</p>
                              </div>
                              {!showSteps && (
                                <button className="ln-btn ln-btn-ghost" style={{ marginTop: '0.9rem' }} onClick={() => setShowSteps(true)}>
                                  <Sparkles size={14} /> Show Step-by-step Solution <ArrowRight size={13} />
                                </button>
                              )}
                            </div>

                            {/* Steps */}
                            <AnimatePresence>
                              {showSteps && content?.step_by_step_solution?.length > 0 && (
                                <motion.div key="st" variants={slideUp} initial="hidden" animate="show">
                                  <div className="ln-reveal-card" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                                    <div className="ln-reveal-title" style={{ color: 'var(--ln-amber)' }}><Zap size={12} /> Step-by-step Solution</div>
                                    <div className="ln-steps-list">
                                      {content?.step_by_step_solution?.map((s, i) => (
                                        <div key={i} className="ln-step-row">
                                          <div className="ln-step-badge">{i + 1}</div>
                                          <div className="ln-step-text">{s}</div>
                                        </div>
                                      ))}
                                    </div>
                                    {!showAnswer && (
                                      <button className="ln-btn ln-btn-ghost" style={{ marginTop: '0.9rem', color: 'var(--ln-green)', borderColor: 'rgba(34,197,94,0.28)' }} onClick={() => setShowAnswer(true)}>
                                        <Eye size={14} /> Reveal Correct Answer
                                      </button>
                                    )}
                                  </div>

                                  {/* Answer reveal */}
                                  <AnimatePresence>
                                    {showAnswer && content?.answer && (
                                      <motion.div key="ans" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                                        <div className="ln-reveal-card" style={{ borderColor: 'rgba(34,197,94,0.28)' }}>
                                          <div className="ln-reveal-title" style={{ color: 'var(--ln-green)' }}><CheckCircle size={12} /> Correct Answer</div>
                                          <div className="ln-answer-box">{content?.answer}</div>
                                          {remediation?.recommendation?.recommendation && (
                                            <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--ln-muted)', fontStyle: 'italic' }}>
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
                </>
              )}

              {/* Stats */}
              {submitResult && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <div className="ln-stats">
                    {[
                      { k: 'XP',       v: submitResult.gamification?.xp ?? '—' },
                      { k: 'Level',    v: submitResult.gamification?.level ?? '—' },
                      { k: 'Streak',   v: `${submitResult.gamification?.streak_days ?? 0}d` },
                      { k: 'Accuracy', v: `${submitResult.performance?.accuracy ?? 0}%` },
                    ].map(s => (
                      <div key={s.k} className="ln-stat">
                        <div className="ln-stat-val">{s.v}</div>
                        <div className="ln-stat-key">{s.k}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button className="ln-btn ln-btn-ghost" onClick={handleNewSetup}>
                  <RotateCcw size={14} /> New Setup
                </button>
                <button className="ln-btn ln-btn-lime" style={{ borderRadius: 12, padding: '0.78rem' }} onClick={handleNextQ} disabled={loadingQ}>
                  {loadingQ ? <Spinner size={15} color="#000" /> : <RefreshCw size={14} />}
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