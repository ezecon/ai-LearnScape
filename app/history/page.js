'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { getQuestionHistory } from '@/services/api'
import { useAuth } from '@/lib/AuthContext'

export default function HistoryPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    getQuestionHistory(user.id).then(data => {
      setHistory(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [user])

  const statusIcon = (status) => {
    if (status === 'true')    return <CheckCircle size={16} color="#22c55e" />
    if (status === 'false')   return <XCircle size={16} color="#ef4444" />
    return <Clock size={16} color="rgba(220,224,255,0.4)" />
  }

  const statusColor = (status) => {
    if (status === 'true')  return 'rgba(34,197,94,0.1)'
    if (status === 'false') return 'rgba(239,68,68,0.1)'
    return 'rgba(255,255,255,0.04)'
  }

  return (
    <AppLayout title="Question History">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.4rem' }}>
          Question History 📋
        </h1>
        <p style={{ color: 'rgba(220,224,255,0.4)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          All questions you've attempted
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(220,224,255,0.4)' }}>
            Loading…
          </div>
        )}

        {!loading && history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(220,224,255,0.4)' }}>
            <BookOpen size={40} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
            No questions yet. Start learning!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: statusColor(item.is_correct),
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '1rem 1.2rem',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {statusIcon(item.is_correct)}
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.topic}</span>
                  <span style={{
                    background: 'rgba(200,255,0,0.1)', color: '#c8ff00',
                    fontSize: '0.65rem', fontWeight: 700,
                    padding: '0.15rem 0.5rem', borderRadius: 99
                  }}>
                    Class {item.class_level}
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(220,224,255,0.35)' }}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('en-BD', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  }) : ''}
                </span>
              </div>

              {/* Question */}
              <p style={{ fontSize: '0.85rem', color: 'rgba(220,224,255,0.7)', lineHeight: 1.6, marginBottom: 8 }}>
                {item.question}
              </p>

              {/* Answers */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {item.correct_answer && (
                  <div style={{
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 8, padding: '0.3rem 0.7rem',
                    fontSize: '0.75rem', color: '#22c55e'
                  }}>
                    ✓ {item.correct_answer}
                  </div>
                )}
                {item.student_answer && (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '0.3rem 0.7rem',
                    fontSize: '0.75rem', color: 'rgba(220,224,255,0.5)'
                  }}>
                    You: {item.student_answer}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}