// frontend/lib/LanguageContext.js
'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')

  // localStorage থেকে saved language load করো
  useEffect(() => {
    const saved = localStorage.getItem('ls-lang')
    if (saved === 'bn' || saved === 'en') setLang(saved)
  }, [])

  function toggleLanguage() {
    const next = lang === 'en' ? 'bn' : 'en'
    setLang(next)
    localStorage.setItem('ls-lang', next)
  }

  const t = translations[lang]

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}