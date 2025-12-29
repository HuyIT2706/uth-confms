import { authService } from './authService'

export async function authFetch(input: RequestInfo, init?: RequestInit) {
  // ensure we have a valid access token (refresh if needed)
  try {
    await authService.ensureAccessToken()
  } catch (e) {
    // no tokens/refresh failed
    throw new Error('Not authenticated')
  }

  const token = authService.getAccessToken()
  const headers = new Headers(init?.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const merged: RequestInit = { ...init, headers }
  let res = await fetch(input, merged)

  if (res.status !== 401) return res

  // Try to refresh once
  try {
    await authService.refresh()
  } catch (e) {
    authService.clear()
    throw new Error('Session expired')
  }

  const newToken = authService.getAccessToken()
  const headers2 = new Headers(init?.headers || {})
  if (newToken) headers2.set('Authorization', `Bearer ${newToken}`)
  const merged2: RequestInit = { ...init, headers: headers2 }
  res = await fetch(input, merged2)
  if (res.status === 401) {
    // still unauthorized — clear and surface
    authService.clear()
  }
  return res
}

export default authFetch
