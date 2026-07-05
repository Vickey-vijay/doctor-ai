// Auth context — holds the current user + token, persists them to localStorage,
// and exposes login / register / logout. Wraps the whole app in <AuthProvider>.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/client'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mq_user') || 'null') } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('mq_token'))
  const [ready, setReady] = useState(false)

  // On mount, if we have a token, re-validate it against /auth/me.
  useEffect(() => {
    let active = true
    async function check() {
      if (!token) { setReady(true); return }
      try {
        const me = await authApi.me()
        if (active) { setUser(me); localStorage.setItem('mq_user', JSON.stringify(me)) }
      } catch {
        if (active) { setUser(null); setToken(null) }
      } finally {
        if (active) setReady(true)
      }
    }
    check()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function persist(data) {
    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('mq_token', data.access_token)
    localStorage.setItem('mq_user', JSON.stringify(data.user))
  }

  async function login(email, password) {
    const data = await authApi.login({ email, password })
    persist(data)
    return data
  }

  async function register(body) {
    const data = await authApi.register(body)
    persist(data)
    return data
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('mq_token')
    localStorage.removeItem('mq_user')
  }

  function updateUser(u) {
    setUser(u)
    localStorage.setItem('mq_user', JSON.stringify(u))
  }

  const value = useMemo(
    () => ({ user, token, ready, login, register, logout, updateUser }),
    [user, token, ready]
  )
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
