import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

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
  const token = localStorage.getItem('accessToken')
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If roles are specified, ensure user's role matches
  if (allowedRoles && allowedRoles.length > 0) {
    const payload = parseJwt(token)
    const role = payload?.role as string | undefined
    if (!role || !allowedRoles.includes(role)) {
      // if role not allowed, redirect to /forbidden (or show compact message)
      return <Navigate to="/forbidden" replace />
    }
  }

  return children
}
