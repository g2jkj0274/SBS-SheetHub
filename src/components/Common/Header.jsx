import React from 'react'
import '../../styles/header.css'

function Header({ currentView, onNavigate }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="header-title">SheetHub</h1>
        <nav className="header-nav">
          <button
            className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
          <button
            className={`nav-btn ${currentView === 'table' ? 'active' : ''}`}
            onClick={() => onNavigate('table')}
          >
            Table
          </button>
          <button
            className={`nav-btn ${currentView === 'audit' ? 'active' : ''}`}
            onClick={() => onNavigate('audit')}
          >
            Audit Log
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
