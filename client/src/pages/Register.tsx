import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email)
}

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!firstName.trim() || !lastName.trim()) return setError('Vui lòng nhập họ và tên')
    if (!validateEmail(email)) return setError('Email không hợp lệ')
    if (password.length < 6) return setError('Password tối thiểu 6 ký tự')
    if (password !== confirmPassword) return setError('Mật khẩu không khớp')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName: `${firstName} ${lastName}` }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || JSON.stringify(json))
      } else {
        setSuccess('Đăng ký thành công')
        if (json.accessToken) localStorage.setItem('accessToken', json.accessToken)
        if (json.refreshToken) localStorage.setItem('refreshToken', json.refreshToken)
        setTimeout(() => navigate('/profile'), 800)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page container">
      <div className="register-left">
        <img alt="hero" src="/hero-placeholder.svg" />
      </div>
      <div className="register-right card register-wrapper">
        <img src="/logo-placeholder.svg" alt="logo" className="top-logo" />
        <h1>Đăng ký</h1>
        <p className="muted">Hãy cùng thiết lập mọi thứ để bạn có thể truy cập vào tài khoản cá nhân của mình.</p>

        <form onSubmit={handleRegister} className="register-form">
          <div className="row">
            <input name="firstName" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input name="lastName" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <div className="row">
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="row">
            <div style={{ position: 'relative', width: '100%' }}>
              <input placeholder="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="eye" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            <div style={{ position: 'relative', width: '100%' }}>
              <input placeholder="Confirm Password" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button type="button" className="eye" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          <label className="terms"><input type="checkbox" /> Tôi đồng ý với tất cả các <u>Điều khoản</u> và <u>Chính sách Bảo mật</u>.</label>

          <div className="actions">
            <button type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : 'Create account'}</button>
          </div>

          <div className="small-note">Bạn đã có tài khoản? <a href="/login">Đăng nhập</a></div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </form>
      </div>
    </div>
  )
}

