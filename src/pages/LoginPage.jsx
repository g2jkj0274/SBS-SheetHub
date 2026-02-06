import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import '../styles/login.css'

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('로그인 시도:', { username })
      
      // users 테이블에서 username과 password 확인
      const { data, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single()

      console.log('로그인 응답:', { data, error: queryError })

      if (queryError || !data) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.')
        return
      }

      // 로그인 성공 - user 데이터 저장
      if (data) {
        localStorage.setItem('currentUser', JSON.stringify(data))
        alert('로그인 성공!')
        onLoginSuccess(data)
      }
    } catch (err) {
      const errorMsg = err.message || JSON.stringify(err)
      console.error('로그인 중 오류:', errorMsg)
      setError('로그인 중 오류가 발생했습니다: ' + errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-container">
      <div className="login-box">
        <h1>관리자 로그인</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              type="text"
              placeholder="아이디 입력"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-info">
          <p>관리자 계정으로만 로그인 가능합니다.</p>
        </div>
      </div>
    </main>
  )
}

export default LoginPage
