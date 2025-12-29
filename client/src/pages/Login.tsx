import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  type LocationState = { from?: { pathname?: string } }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.message || JSON.stringify(json))
      else {
        auth.setTokens(json.accessToken, json.refreshToken)
        const from = ((location.state as LocationState)?.from?.pathname) || '/profile'
        navigate(from)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page card" style={{ maxWidth: 420 }}>
      <img src="/logo-placeholder.svg" alt="logo" style={{ width: 120, marginBottom: 12, alignSelf: 'center' }} />
      <h2>Đăng nhập</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input name="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input name="password" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={loading} style={{ width: '100%', background: '#008b88', color: 'white', padding: 12, borderRadius: 6 }}>{loading ? 'Đang xử lý...' : 'Login'}</button>
        {error && <div className="error">{error}</div>}
      </form>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <span style={{ color: '#556' }}>Chưa có tài khoản? </span><a href="/register">Đăng ký</a>
      </div>
    </div>
  )
}

