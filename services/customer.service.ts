import prisma from '@/lib/prisma'
import { Customer } from '@prisma/client'

interface CustomerData {
  name_ar: string
  email?: string | null
  phone: string
  nationality?: string | null
  passport_number?: string | null
  notes?: string | null
  created_by?: string | null
}

export const customerService = {
  async getAll(): Promise<Customer[]> {
    return await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })
  },

  async create(data: CustomerData): Promise<Customer> {
    return await prisma.customer.create({
      data: {
        nameAr: data.name_ar,
        email: data.email || null,
        phone: data.phone,
        nationality: data.nationality || null,
        passportNumber: data.passport_number || null,
        notes: data.notes || null,
        createdBy: data.created_by || null,
      },
    })
  },

  async update(id: string, data: Partial<CustomerData>): Promise<Customer> {
    return await prisma.customer.update({
      where: { id },
      data: {
        nameAr: data.name_ar,
        email: data.email || null,
        phone: data.phone,
        nationality: data.nationality || null,
        passportNumber: data.passport_number || null,
        notes: data.notes || null,
      },
    })
  },

  async delete(id: string): Promise<void> {
    await prisma.customer.delete({
      where: { id },
    })
  },
}
