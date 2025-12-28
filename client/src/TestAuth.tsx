import React, { useState } from 'react';

type Tokens = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string | number;
  refreshExpiresIn?: string;
};

export default function TestAuth() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('pass123');
  const [fullName, setFullName] = useState('Test User');
  const [result, setResult] = useState<any>(null);
  const [tokens, setTokens] = useState<Tokens>({});

  async function register() {
    setResult(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      const json = await res.json();
      setResult({ status: res.status, body: json });
      if (res.ok) {
        setTokens({ accessToken: json.accessToken, refreshToken: json.refreshToken });
      }
    } catch (err) {
      setResult({ error: String(err) });
    }
  }

  async function login() {
    setResult(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      setResult({ status: res.status, body: json });
      if (res.ok) setTokens({ accessToken: json.accessToken, refreshToken: json.refreshToken });
    } catch (err) {
      setResult({ error: String(err) });
    }
  }

  async function refresh() {
    setResult(null);
    try {
      const res = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      const json = await res.json();
      setResult({ status: res.status, body: json });
      if (res.ok) setTokens({ accessToken: json.accessToken, refreshToken: json.refreshToken });
    } catch (err) {
      setResult({ error: String(err) });
    }
  }

  async function logout() {
    setResult(null);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      const json = await res.json();
      setResult({ status: res.status, body: json });
      if (res.ok) setTokens({});
    } catch (err) {
      setResult({ error: String(err) });
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Test Auth UI</h2>
      <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <label>
          Email<br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password<br />
          <input value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          Full name (register only)<br />
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={register}>Register</button>
          <button onClick={login}>Login</button>
          <button onClick={refresh} disabled={!tokens.refreshToken}>Refresh</button>
          <button onClick={logout} disabled={!tokens.refreshToken}>Logout</button>
        </div>

        <div>
          <h3>Stored tokens</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(tokens, null, 2)}</pre>
        </div>

        <div>
          <h3>Last result</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
