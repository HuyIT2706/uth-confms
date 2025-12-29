import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../lib/authService'

type User = { id?: string; email?: string; role?: string; [k: string]: any } | null

type AuthContextValue = {
  user: User
  isAuthenticated: boolean
  setTokens: (accessToken: string | null, refreshToken?: string | null) => void
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    const token = authService.getAccessToken()
    const payload = token ? (JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as any) : null
    return payload ?? null
  })

  useEffect(() => {
    const unsubscribe = authService.subscribe((tokens) => {
      const payload = tokens.accessToken
        ? (JSON.parse(atob(tokens.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as any)
        : null
      setUser(payload ?? null)
    })
    return unsubscribe
  }, [])

  function setTokens(accessToken: string | null, refreshToken?: string | null) {
    authService.setTokens(accessToken, refreshToken)
  }

  function logout() {
    authService.clear()
  }

  async function refresh() {
    await authService.refresh()
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    setTokens,
    logout,
    refresh,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
