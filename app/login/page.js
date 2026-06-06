'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { Spinner } from '@/components/ui'
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const { user, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

useEffect(() => {
  if (user) {
    router.replace('/dashboard')
  }
}, [user, router])

 const handleGoogleLogin =
  async () => {

    setLoading(true)

    try {

      await signInWithGoogle()

    } catch (err) {

      console.error(err)

      setLoading(false)
    }
  }

  const features = [
    { icon: '🏏', text: 'Context-aware questions in your world' },
    { icon: '🧠', text: 'AI detects your misconceptions' },
    { icon: '📈', text: 'Adapts difficulty to your level' },
    { icon: '🏆', text: 'XP, badges & leaderboard' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(204,255,0,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 420, width: '100%', position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'var(--lime)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 0 30px rgba(204,255,0,0.3)',
            }}>
              <Zap size={30} color="#000" />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
              LearnScape <span style={{ color: 'var(--lime)' }}>AI</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Learning inside your world
            </p>
          </div>

          {/* Login card */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>
              Get started free
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              For Bangladesh students, Class 3–10
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn-lime"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.85rem' }}
            >
              {loading ? (
                <><Spinner size={18} color="#000" /> Signing in...</>
              ) : (
                <>
                  <FcGoogle />
                  Continue with Google
                </>
              )}
            </button>

            {/* Features */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{f.icon}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
            Free forever · No credit card
          </p>
        </motion.div>
      </div>
    </div>
  )
}