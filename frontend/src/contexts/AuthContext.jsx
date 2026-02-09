import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user email is stored
    const storedEmail = localStorage.getItem('userEmail')
    if (storedEmail) {
      checkAuthStatus(storedEmail)
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuthStatus = async (email) => {
    try {
      const response = await axios.get(`/api/auth/status?email=${email}`)
      if (response.data.connected) {
        setUser({
          email: response.data.email,
          dailyLimit: response.data.daily_limit
        })
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to check auth status:', error)
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const initGoogleAuth = async () => {
    try {
      const response = await axios.get('/api/auth/google')
      window.location.href = response.data.authorization_url
    } catch (error) {
      console.error('Failed to initiate Google auth:', error)
      throw error
    }
  }

  const disconnect = async () => {
    try {
      await axios.delete(`/api/auth/disconnect?email=${user.email}`)
      setUser(null)
      setIsConnected(false)
      localStorage.removeItem('userEmail')
    } catch (error) {
      console.error('Failed to disconnect:', error)
      throw error
    }
  }

  const setUserEmail = (email) => {
    localStorage.setItem('userEmail', email)
    checkAuthStatus(email)
  }

  const value = {
    user,
    isConnected,
    loading,
    initGoogleAuth,
    disconnect,
    checkAuthStatus,
    setUserEmail
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
