'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { Spinner } from '@/components/ui'
import { FcGoogle } from 'react-icons/fc'

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Serif:ital@0;1&display=swap');

    :root {
      --lg-bg: #06070d;
      --lg-surface: #0b0c15;
      --lg-border: rgba(255,255,255,0.07);
      --lg-text: #f0f2ff;
      --lg-muted: rgba(220,224,255,0.42);
      --lg-lime: #c8ff00;
      --lg-lime-dim: rgba(200,255,0,0.12);
      --lg-blue: #4f8cff;
      --lg-cyan: #00e5ff;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .lg-root {
      min-height: 100vh;
      background: var(--lg-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      font-family: 'Cabinet Grotesk', sans-serif;
      color: var(--lg-text);
      position: relative;
      overflow: hidden;
    }

    /* ── Layered background ── */
    .lg-bg-layer {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
    }

    /* Large radial orbs */
    .lg-orb {
      position: absolute; border-radius: 50%; filter: blur(100px);
      animation: orbFloat 20s ease-in-out infinite alternate;
    }
    .lg-orb-1 {
      width: 700px; height: 700px;
      top: -250px; left: -200px;
      background: radial-gradient(circle, rgba(200,255,0,0.07) 0%, transparent 65%);
      animation-duration: 18s;
    }
    .lg-orb-2 {
      width: 500px; height: 500px;
      bottom: -150px; right: -100px;
      background: radial-gradient(circle, rgba(79,140,255,0.07) 0%, transparent 65%);
      animation-duration: 24s; animation-direction: alternate-reverse;
    }
    .lg-orb-3 {
      width: 300px; height: 300px;
      top: 50%; left: 55%;
      background: radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 65%);
      animation-duration: 30s;
    }
    @keyframes orbFloat {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(25px, 35px) scale(1.06); }
    }

    /* Grid pattern */
    .lg-grid {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image:
        linear-gradient(rgba(200,255,0,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(200,255,0,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 100%);
    }

    /* Noise */
    .lg-noise {
      position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.35;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      background-size: 256px 256px;
    }

    /* ── Layout ── */
    .lg-wrap {
      position: relative; z-index: 2;
      width: 100%; max-width: 440px;
    }

    /* ── Logo zone ── */
    .lg-logo-zone { text-align: center; margin-bottom: 2.25rem; }

    .lg-icon-wrap {
      display: inline-flex; align-items: center; justify-content: center;
      width: 68px; height: 68px; border-radius: 22px;
      background: var(--lg-lime);
      box-shadow: 0 0 0 1px rgba(200,255,0,0.5), 0 0 40px rgba(200,255,0,0.3), 0 0 80px rgba(200,255,0,0.12);
      margin-bottom: 1.25rem;
      animation: iconPulse 4s ease-in-out infinite;
    }
    @keyframes iconPulse {
      0%,100% { box-shadow: 0 0 0 1px rgba(200,255,0,0.5), 0 0 40px rgba(200,255,0,0.3), 0 0 80px rgba(200,255,0,0.12); }
      50%      { box-shadow: 0 0 0 1px rgba(200,255,0,0.6), 0 0 55px rgba(200,255,0,0.4), 0 0 110px rgba(200,255,0,0.18); }
    }

    .lg-brand {
      font-size: 2.2rem; font-weight: 900; letter-spacing: -0.03em; line-height: 1;
      margin-bottom: 0.45rem;
    }
    .lg-brand-em { color: var(--lg-lime); font-style: italic; font-family: 'Instrument Serif', serif; }

    .lg-tagline {
      font-size: 0.88rem; color: var(--lg-muted); font-weight: 400; line-height: 1.5;
    }

    /* ── Card ── */
    .lg-card {
      background: rgba(11,12,21,0.85);
      border: 1px solid var(--lg-border);
      border-radius: 24px;
      padding: 2rem;
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      position: relative; overflow: hidden;
    }

    /* Top glow strip */
    .lg-card::before {
      content: '';
      position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(200,255,0,0.5), transparent);
    }

    /* Inner corner accent */
    .lg-card-glow {
      position: absolute; width: 260px; height: 260px;
      top: -100px; right: -80px; border-radius: 50%;
      background: radial-gradient(circle, rgba(200,255,0,0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    .lg-card-title {
      font-size: 1.15rem; font-weight: 800; color: var(--lg-text);
      margin-bottom: 4px; letter-spacing: -0.01em;
    }
    .lg-card-sub {
      font-size: 0.8rem; color: var(--lg-muted); margin-bottom: 1.5rem; font-weight: 400;
    }

    /* ── Google button ── */
    .lg-btn-google {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 0.9rem 1.25rem;
      border-radius: 14px;
      background: var(--lg-lime); color: #000;
      border: none; cursor: pointer;
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: 0.95rem; font-weight: 800;
      letter-spacing: 0.01em;
      transition: all 0.22s;
      position: relative; overflow: hidden;
    }
    .lg-btn-google::after {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
      pointer-events: none;
    }
    .lg-btn-google:hover:not(:disabled) {
      background: #d9ff20;
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(200,255,0,0.28), 0 0 0 1px rgba(200,255,0,0.4);
    }
    .lg-btn-google:active:not(:disabled) { transform: translateY(0); }
    .lg-btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Divider ── */
    .lg-divider {
      display: flex; align-items: center; gap: 12px;
      margin: 1.4rem 0;
    }
    .lg-divider-line { flex: 1; height: 1px; background: var(--lg-border); }
    .lg-divider-text { font-size: 0.7rem; color: var(--lg-muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }

    /* ── Feature list ── */
    .lg-features { display: flex; flex-direction: column; gap: 9px; }
    .lg-feat {
      display: flex; align-items: center; gap: 10px;
      padding: 0.6rem 0.75rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 11px;
      transition: border-color 0.2s, background 0.2s;
    }
    .lg-feat:hover { border-color: rgba(200,255,0,0.18); background: rgba(200,255,0,0.03); }
    .lg-feat-icon {
      font-size: 1rem; width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.05); border-radius: 8px; flex-shrink: 0;
    }
    .lg-feat-text { font-size: 0.78rem; color: var(--lg-muted); font-weight: 500; line-height: 1.35; }

    /* ── Footer note ── */
    .lg-footer {
      text-align: center; font-size: 0.72rem; color: var(--lg-muted);
      margin-top: 1.25rem; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .lg-footer-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--lg-muted); }
    .lg-footer span { color: var(--lg-lime); font-weight: 700; }

    /* ── Floating badge ── */
    .lg-badge {
      position: absolute; top: -14px; right: 18px;
      background: linear-gradient(135deg, #c8ff00, #a0d400);
      color: #000; font-size: 0.62rem; font-weight: 800;
      padding: 0.22rem 0.65rem; border-radius: 99px;
      letter-spacing: 0.08em; text-transform: uppercase;
      box-shadow: 0 4px 14px rgba(200,255,0,0.3);
    }
  `}</style>
)

const features = [
  { icon: '🏏', text: 'Questions set in your world — cricket, Eid, rickshaws' },
  { icon: '🧠', text: 'AI spots misconceptions as you learn' },
  { icon: '📈', text: 'Difficulty adapts to your level in real time' },
  { icon: '🏆', text: 'XP, badges, streaks & national leaderboard' },
]

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } }
}
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }
}

export default function LoginPage() {
  const { user, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="lg-root">
      <GlobalStyles />

      {/* Background layers */}
      <div className="lg-bg-layer">
        <div className="lg-orb lg-orb-1" />
        <div className="lg-orb lg-orb-2" />
        <div className="lg-orb lg-orb-3" />
      </div>
      <div className="lg-grid" />
      <div className="lg-noise" />

      <div className="lg-wrap">
        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* Logo zone */}
          <motion.div variants={fadeUp} className="lg-logo-zone">
            <div className="lg-icon-wrap">
              <Zap size={32} color="#000" strokeWidth={2.8} />
            </div>
            <div className="lg-brand">
              LearnScape <span className="lg-brand-em">AI</span>
            </div>
            <p className="lg-tagline">Learning inside your world</p>
          </motion.div>

          {/* Card */}
          <motion.div variants={fadeUp} className="lg-card">
            <div className="lg-card-glow" />
            <div className="lg-badge">Free Forever</div>

            <div className="lg-card-title">Get started free</div>
            <div className="lg-card-sub">For Bangladesh students · Class 3–10</div>

            {/* Google button */}
            <button
              className="lg-btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <><Spinner size={18} color="#000" /> Signing in…</>
              ) : (
                <><FcGoogle size={20} /> Continue with Google</>
              )}
            </button>

            {/* Divider */}
            <div className="lg-divider">
              <div className="lg-divider-line" />
              <span className="lg-divider-text">What you get</span>
              <div className="lg-divider-line" />
            </div>

            {/* Features */}
            <div className="lg-features">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  className="lg-feat"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.08, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="lg-feat-icon">{f.icon}</div>
                  <div className="lg-feat-text">{f.text}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div variants={fadeUp} className="lg-footer">
            <span><span>Free</span> forever</span>
            <div className="lg-footer-dot" />
            <span>No credit card</span>
            <div className="lg-footer-dot" />
            <span>Bangladesh 🇧🇩</span>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}