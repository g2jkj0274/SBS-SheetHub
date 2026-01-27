import { useState } from 'react'
import Header from './components/Common/Header'
import DataTablePage from './pages/DataTablePage'
import ClockRing from './components/Common/ClockRing'
import './styles/app.css'

function App() {
  const [view, setView] = useState('home') // home | table

  return (
    <>
      <Header currentView={view} onNavigate={setView} />

      {view === 'table' ? (
        <DataTablePage />
      ) : (
        <main className="app-container">
          <ClockRing />
        </main>
      )}
    </>
  )
}

export default App
