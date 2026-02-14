import prisma from '@/lib/prisma'
import { City } from '@prisma/client'

export const cityService = {
  async getAll(): Promise<City[]> {
    return await prisma.city.findMany({
      orderBy: { nameAr: 'asc' },
    })
  },

  async create(data: {
    name_ar: string
    name_tr?: string
    country_ar?: string
  }): Promise<City> {
    return await prisma.city.create({
      data: {
        nameAr: data.name_ar,
        nameTr: data.name_tr,
        countryAr: data.country_ar || 'تركيا',
      },
    })
  },

  async update(
    id: string,
    data: {
      name_ar?: string
      name_tr?: string
      country_ar?: string
    }
  ): Promise<City> {
    return await prisma.city.update({
      where: { id },
      data: {
        nameAr: data.name_ar,
        nameTr: data.name_tr,
        countryAr: data.country_ar,
      },
    })
  },

  async delete(id: string): Promise<void> {
    await prisma.city.delete({
      where: { id },
    })
  },
}
