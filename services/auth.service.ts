import bcrypt from 'bcryptjs'
import { AppRole } from '@prisma/client'
import prisma from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import { AuthResponse, User } from '@/types/auth'

export const authService = {
  async signUp(
    email: string,
    password: string,
    name: string,
    initial: string,
    role: AppRole
  ): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new Error('User already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        userRoles: {
          create: {
            role: role as AppRole,
          },
        },
        employee: {
          create: {
            nameAr: name,
            email,
            initial,
          },
        },
      },
      include: {
        userRoles: true,
        employee: true,
      },
    })

    const token = await generateToken(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.userRoles[0]?.role,
        employee: user.employee,
      },
      token,
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: true,
        employee: true,
      },
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new Error('Invalid credentials')
    }

    const token = await generateToken(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.userRoles[0]?.role,
        employee: user.employee,
      },
      token,
    }
  },

  async getMe(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: true,
        employee: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      role: user.userRoles[0]?.role,
      employee: user.employee,
    }
  },
}
