import bcrypt from 'bcryptjs'
import { PrismaClient, AppRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = "admin@admin.com"
  const password = "password"
  const name = "Admin"
  const initial = "ADM"
  const role = "admin"

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      console.log('User already exists, updating password...')
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      })
      console.log('Password updated.')
      return
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
    console.log("Admin user created successfully:", user.email)
  } catch (err) {
    console.error("Error creating user:", err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
