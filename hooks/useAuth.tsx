'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import api from '@/lib/api-client'

export type AppRole = 'admin' | 'sales' | 'booking'

interface User {
  id: string
  email: string
  role: AppRole
  employee: Employee | null
}

interface Employee {
  id: string
  nameAr: string
  email: string
  phone: string | null
  initial: string
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  employee: Employee | null
  role: AppRole | null
  isLoading: boolean
  isAdmin: boolean
  isSales: boolean
  isBooking: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name: string, initial: string, role: AppRole) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/auth/me')
      const userData = response.user
      setUser(userData)
      setEmployee(userData.employee)
      setRole(userData.role)
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { user, token } = response
      
      // Token is now in HTTP-only cookie, no need to store in localStorage
      setUser(user)
      setEmployee(user.employee)
      setRole(user.role)
      
      return { error: null }
    } catch (error: any) {
      console.error('Login error:', error)
      return { error: error instanceof Error ? error : new Error('Login failed') }
    }
  }

  const signUp = async (email: string, password: string, name: string, initial: string, role: AppRole) => {
    try {
      const response = await api.post('/api/auth/signup', {
        email,
        password,
        name,
        initial,
        role,
      })
      
      const { user, token } = response
      
      setUser(user)
      setEmployee(user.employee)
      setRole(user.role)

      return { error: null }
    } catch (error: any) {
      console.error('Signup error:', error)
      return { error: error instanceof Error ? error : new Error('Signup failed') }
    }
  }

  const signOut = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
    setEmployee(null)
    setRole(null)
  }

  const value = {
    user,
    employee,
    role,
    isLoading,
    isAdmin: role === 'admin',
    isSales: role === 'sales',
    isBooking: role === 'booking',
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
