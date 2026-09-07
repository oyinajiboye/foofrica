import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { API_BASE } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ff_user') || 'null') } catch { return null }
  })
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('ff_token'))
  const tokenRef = useRef(accessToken)
  const refreshRef = useRef(null)
  const generation = useRef(0)

  const saveSession = useCallback((token, profile, refreshToken) => {
    if (!token) throw new Error('No session was returned. Please sign in to continue.')
    tokenRef.current = token
    localStorage.setItem('ff_token', token)
    localStorage.setItem('ff_user', JSON.stringify(profile ?? null))
    if (refreshToken) { generation.current += 1; localStorage.setItem('ff_refresh_token', refreshToken) }
    setAccessToken(token)
    setUser(profile ?? null)
  }, [])

  const clearSession = useCallback(() => {
    generation.current += 1
    for (const key of ['ff_token', 'ff_user', 'ff_refresh_token', 'ff_demo_session']) localStorage.removeItem(key)
    for (const key of ['ff_onboard_type', 'ff_onboard_identity', 'ff_onboard_interests', 'ff_onboard_avatar_data']) sessionStorage.removeItem(key)
    tokenRef.current = null
    setAccessToken(null)
    setUser(null)
  }, [])

  const apiFetch = useCallback(async (path, options = {}) => {
    const send = () => {
      const headers = new Headers(options.headers)
      if (!(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
      if (tokenRef.current) headers.set('Authorization', `Bearer ${tokenRef.current}`)
      return fetch(`${API_BASE}${path}`, { ...options, headers })
    }
    const originalToken = tokenRef.current
    let res = await send()
    if (res.status === 401 && originalToken && !['/api/auth/login', '/api/auth/register', '/api/auth/refresh'].includes(path)) {
      if (tokenRef.current === originalToken) {
        if (!refreshRef.current) {
          const currentGeneration = generation.current
          refreshRef.current = (async () => {
            const refresh_token = localStorage.getItem('ff_refresh_token')
            if (!refresh_token) { clearSession(); throw new Error('Please sign in again.') }
            const response = await fetch(`${API_BASE}/api/auth/refresh`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token }),
            })
            const result = await response.json().catch(() => ({}))
            if (!response.ok || !result.data?.access_token) {
              if (response.status === 401 || response.status === 400) clearSession()
              throw new Error(result.message || 'Unable to renew your session. Please try again.')
            }
            if (generation.current !== currentGeneration) throw new Error('Session ended. Please sign in again.')
            tokenRef.current = result.data.access_token
            localStorage.setItem('ff_token', result.data.access_token)
            localStorage.setItem('ff_refresh_token', result.data.refresh_token)
            setAccessToken(result.data.access_token)
          })().finally(() => { refreshRef.current = null })
        }
        await refreshRef.current
      }
      if (!tokenRef.current) throw new Error('Please sign in again.')
      res = await send()
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
    return data
  }, [clearSession])

  return <AuthContext.Provider value={{ user, accessToken, apiFetch, saveSession, clearSession }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
