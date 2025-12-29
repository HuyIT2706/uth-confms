type Tokens = { accessToken: string | null; refreshToken: string | null }

function parseJwt(token: string | null) {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

class AuthService {
  private tokens: Tokens = { accessToken: null, refreshToken: null }
  private refreshPromise: Promise<Tokens> | null = null
  private listeners = new Set<(t: Tokens) => void>()

  constructor() {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    this.tokens = { accessToken, refreshToken }
  }

  getAccessToken() {
    return this.tokens.accessToken
  }

  getRefreshToken() {
    return this.tokens.refreshToken
  }

  setTokens(accessToken: string | null, refreshToken?: string | null) {
    this.tokens.accessToken = accessToken
    if (accessToken) localStorage.setItem('accessToken', accessToken)
    else localStorage.removeItem('accessToken')

    if (typeof refreshToken !== 'undefined') {
      this.tokens.refreshToken = refreshToken
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
      else localStorage.removeItem('refreshToken')
    }

    this.emit()
  }

  clear() {
    this.tokens = { accessToken: null, refreshToken: null }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    this.emit()
  }

  private emit() {
    for (const cb of this.listeners) cb(this.tokens)
  }

  subscribe(cb: (t: Tokens) => void) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  isAccessTokenExpired(thresholdSeconds = 60) {
    const token = this.tokens.accessToken
    if (!token) return true
    const payload = parseJwt(token)
    if (!payload || !payload.exp) return true
    const exp = payload.exp * 1000
    return Date.now() + thresholdSeconds * 1000 >= exp
  }

  async refresh(): Promise<Tokens> {
    if (!this.tokens.refreshToken) throw new Error('no refresh token')
    if (this.refreshPromise) return this.refreshPromise

    this.refreshPromise = (async () => {
      try {
        const res = await fetch('/api/auth/refresh-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
        })
        if (!res.ok) throw new Error('refresh failed')
        const json = await res.json()
        const next = { accessToken: json.accessToken ?? null, refreshToken: json.refreshToken ?? null }
        this.setTokens(next.accessToken, next.refreshToken)
        return next
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async ensureAccessToken() {
    if (!this.tokens.accessToken) {
      // try to refresh
      await this.refresh()
      return this.tokens.accessToken
    }
    if (this.isAccessTokenExpired()) {
      await this.refresh()
    }
    return this.tokens.accessToken
  }
}

export const authService = new AuthService()

export type { Tokens }
