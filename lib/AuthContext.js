'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

 useEffect(() => {
  const getInitialSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      // invalid token হলে auto logout
      if (error) {
        console.error(error)
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
    } catch (err) {
      console.error(err)
      setSession(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  getInitialSession()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, sess) => {
  setSession(sess)
  setUser(sess?.user ?? null)
  setLoading(false) 
})

  return () => subscription.unsubscribe()
}, [])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
