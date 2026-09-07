import { createContext, useContext, useState, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('ff_user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem('ff_token') || null
  )

  const saveSession = useCallback((token, profile) => {
    localStorage.setItem('ff_token', token)
    localStorage.setItem('ff_user', JSON.stringify(profile))
    setAccessToken(token)
    setUser(profile)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('ff_token')
    localStorage.removeItem('ff_user')
    setAccessToken(null)
    setUser(null)
  }, [])

  const apiFetch = useCallback(async (path, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    }
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
    return data
  }, [accessToken])

  return (
    <AuthContext.Provider value={{ user, accessToken, apiFetch, saveSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
