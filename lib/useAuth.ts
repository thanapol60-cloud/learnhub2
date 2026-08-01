'use client'

import { useState, useEffect, useCallback } from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const register = useCallback(
    async (email: string, password: string, name: string, role: string = 'user') => {
      setLoading(true)
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Registration failed')
        }

        const data = await response.json()
        setUser(data.user)
        return data
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Login failed')
        }

        const data = await response.json()
        setUser(data.user)
        return data
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }, [])

  return { user, loading, error, register, login, logout }
}
