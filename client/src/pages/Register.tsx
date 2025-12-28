import React, { useState } from 'react';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName: `${firstName} ${lastName}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || JSON.stringify(json));
      } else {
        setSuccess('Registered successfully');
        // store tokens if provided
        if (json.accessToken) localStorage.setItem('accessToken', json.accessToken);
        if (json.refreshToken) localStorage.setItem('refreshToken', json.refreshToken);
      }
    } catch (err: any) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-left">
        {/* Placeholder for hero image */}
        <div className="hero-placeholder">Hero image</div>
      </div>
      <div className="register-right">
        <h1>Đăng ký</h1>
        <p>Hãy cùng thiết lập mọi thứ để bạn có thể truy cập vào tài khoản cá nhân của mình.</p>
        <form onSubmit={handleRegister} className="register-form">
          <div className="row">
            <input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="row">
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

          <label className="terms"><input type="checkbox" /> Tôi đồng ý với tất cả các Điều khoản và Chính sách Bảo mật.</label>

          <div className="actions">
            <button type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : 'Create account'}</button>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </form>
      </div>
    </div>
  );
}
