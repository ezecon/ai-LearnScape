// frontend/app/layout.js
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import { LanguageProvider } from '@/lib/LanguageContext'  

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LanguageProvider>   {/* ← wrap করো */}
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}