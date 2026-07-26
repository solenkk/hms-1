import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hms_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('hms_token'))

  const login = useCallback(async (username, password) => {
    const res = await authApi.login({ username, password })
    const { access_token } = res.data
    localStorage.setItem('hms_token', access_token)
    const me = await authApi.me()
    localStorage.setItem('hms_user', JSON.stringify(me.data))
    setToken(access_token)
    setUser(me.data)
    return me.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('hms_token')
    localStorage.removeItem('hms_user')
    setToken(null)
    setUser(null)
  }, [])

  const hasRole = useCallback((...roles) => {
    if (!user?.role) return false
    return roles.includes(user.role)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
