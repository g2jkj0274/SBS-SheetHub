import React, { useState } from 'react'
import { supabase } from '../../../supabaseClient'
import '../../styles/header.css'

function Header({ currentView, onNavigate, user, onLogout }) {
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleLogout = () => {
    if (window.confirm('정말 로그아웃하시겠습니까?')) {
      onLogout()
    }
  }

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
            className={`nav-btn ${currentView === 'timetable' ? 'active' : ''}`}
            onClick={() => onNavigate('timetable')}
          >
            Timetable
          </button>
          <button
            className={`nav-btn ${currentView === 'audit' ? 'active' : ''}`}
            onClick={() => onNavigate('audit')}
          >
            Audit Log
          </button>
          
          {user ? (
            <>
              <span className="user-email">{user.username}</span>
              <button className="nav-btn logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <button className="nav-btn login-btn" onClick={() => setShowLoginModal(true)}>
              로그인
            </button>
          )}
        </nav>
      </div>

      {showLoginModal && (
        <div className="login-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <LoginFormModal onClose={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}
    </header>
  )
}

// 간단한 로그인 모달 폼
function LoginFormModal({ onClose }) {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // users 테이블에서 username과 password 확인
      const { data, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single()

      if (queryError || !data) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.')
        return
      }

      // 로그인 성공 - localStorage에 저장 후 페이지 새로고침
      localStorage.setItem('currentUser', JSON.stringify(data))
      alert('로그인 성공!')
      window.location.reload()
    } catch (err) {
      setError(err.message || '로그인 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="login-modal-form">
      <h2>로그인</h2>
      <input
        type="text"
        placeholder="아이디"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
        required
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
      />
      {error && <div className="error-text">{error}</div>}
      <div className="modal-buttons">
        <button type="submit" disabled={loading} className="btn-login">
          {loading ? '로그인 중...' : '로그인'}
        </button>
        <button type="button" onClick={onClose} className="btn-cancel">
          닫기
        </button>
      </div>
    </form>
  )
}

export default Header
