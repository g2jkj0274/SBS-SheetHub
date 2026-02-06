import { useState, useEffect } from 'react'
import Header from './components/Common/Header'
import DataTablePage from './pages/DataTablePage'
import AuditLogPage from './pages/AuditLogPage'
import TimetablePage from './pages/TimetablePage'
import ClockRing from './components/Common/ClockRing'
import './styles/app.css'

function App() {
  const [view, setView] = useState('home')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // localStorage에서 currentUser 읽기
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (err) {
        console.error('User parse error:', err)
        localStorage.removeItem('currentUser')
      }
    }
    setLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setUser(null)
    setView('home')
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>로드 중...</div>
  }

  return (
    <>
      <Header currentView={view} onNavigate={setView} user={user} onLogout={handleLogout} />

      {view === 'table' ? (
        <DataTablePage />
      ) : view === 'timetable' ? (
        <TimetablePage user={user} />
      ) : view === 'audit' ? (
        <AuditLogPage />
      ) : (
        <main className="app-container">
          <ClockRing />
        </main>
      )}
    </>
  )
}

export default App
