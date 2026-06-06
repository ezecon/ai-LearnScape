'use client'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

export default function AppLayout({ children, title }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        <TopNav title={title} />
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
