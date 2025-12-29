import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

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
export default function RequireAuth({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const auth = useAuth()
  const location = useLocation()

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If roles are specified, ensure user's role matches
  if (allowedRoles && allowedRoles.length > 0) {
    const role = (auth.user as any)?.role as string | undefined
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/forbidden" replace />
    }
  }

  return <>{children}</>
}
