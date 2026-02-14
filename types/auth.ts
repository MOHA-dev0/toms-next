import { AppRole } from '@prisma/client'

export interface User {
  id: string
  email: string
  role: AppRole
  employee: Employee | null
}

export interface Employee {
  id: string
  nameAr: string
  email: string
  phone: string | null
  initial: string
  isActive: boolean
}

export interface AuthResponse {
  user: User
  token: string
}

export type { AppRole }
