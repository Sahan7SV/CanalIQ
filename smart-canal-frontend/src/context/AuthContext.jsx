import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext()

// Hardcoded credentials – replace with real API call later
const MOCK_USERS = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' },
  { username: 'user',  password: 'user123',  role: 'user',  name: 'Farm Officer' },
]

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  const login = useCallback((username, password) => {
    const found = MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    )
    if (found) {
      setUser({ role: found.role, name: found.name })
      return { success: true }
    }
    return { success: false, message: 'Invalid username or password' }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)