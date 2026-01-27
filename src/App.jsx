import { useState } from 'react'
import Header from './components/Common/Header'
import DataTablePage from './pages/DataTablePage'
import AuditLogPage from './pages/AuditLogPage'
import ClockRing from './components/Common/ClockRing'
import './styles/app.css'

function App() {
  const [view, setView] = useState('home') // home | table | audit

  return (
    <>
      <Header currentView={view} onNavigate={setView} />

      {view === 'table' ? (
        <DataTablePage />
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
