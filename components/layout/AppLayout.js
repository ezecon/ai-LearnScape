'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

function AuthLoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#07080e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid rgba(200,255,0,0.15)',
        borderTopColor: '#c8ff00',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'rgba(220,224,255,0.4)', fontSize: '0.85rem' }}>Loading…</p>
    </div>
  )
}

export default function AppLayout({ children, title }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/login')
  }, [user, loading, router])

  if (loading || !user) return <AuthLoadingScreen />

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        <TopNav title={title} />
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  )
}