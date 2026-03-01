import prisma from '@/lib/prisma'
import { Hotel, Prisma } from '@prisma/client'

export function validateRoomTypes(roomTypes: any[]) {
  if (!roomTypes) return;
  for (let i = 0; i < roomTypes.length; i++) {
    const rt = roomTypes[i];
    const nameObj = rt.nameAr || `Room ${i + 1}`;
    if (rt.pricings && rt.pricings.length > 0) {
      for (let j = 0; j < rt.pricings.length; j++) {
        const p = rt.pricings[j];
        if (!p.validFrom || !p.validTo || p.price == null) {
          throw new Error(`الرجاء إكمال جميع حقول الأسعار للغرفة: ${nameObj}`);
        }
        if (new Date(p.validFrom) > new Date(p.validTo)) {
          throw new Error(`تاريخ البداية يجب أن يكون قبل تاريخ النهاية في الغرفة: ${nameObj}`);
        }
      }
      for (let j = 0; j < rt.pricings.length; j++) {
        for (let k = j + 1; k < rt.pricings.length; k++) {
          const startA = new Date(rt.pricings[j].validFrom).getTime();
          const endA = new Date(rt.pricings[j].validTo).getTime();
          const startB = new Date(rt.pricings[k].validFrom).getTime();
          const endB = new Date(rt.pricings[k].validTo).getTime();
          if (startA <= endB && startB <= endA) {
            throw new Error(`يوجد تداخل في تواريخ الأسعار للغرفة: ${nameObj}`);
          }
        }
      }
    }
  }
}

export const hotelService = {
  async getAll() {
    return await prisma.hotel.findMany({
      include: {
        city: true,
        roomTypes: {
          include: { roomPricing: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getById(id: string) {
    return await prisma.hotel.findUnique({
      where: { id },
      include: {
        city: true,
        roomTypes: {
          include: { roomPricing: true }
        },
      },
    })
  },

  async create(data: {
    nameAr: string
    cityId: string
    roomTypes: {
      nameAr: string
      board: string
      price: number
      currency: string
      imageUrl?: string
      pricings?: {
        validFrom: string
        validTo: string
        price: number
      }[]
    }[]
  }) {
    validateRoomTypes(data.roomTypes);
    return await prisma.hotel.create({
      data: {
        nameAr: data.nameAr,
        cityId: data.cityId,
        roomTypes: {
          create: data.roomTypes.map((rt) => ({
            nameAr: rt.nameAr,
            board: rt.board,
            basePrice: rt.price,
            currency: rt.currency as any, // Cast to Currency enum
            imageUrl: rt.imageUrl,
          })),
        },
      },
      include: {
        city: true,
        roomTypes: {
          include: { roomPricing: true }
        },
      },
    })
  },

  async update(
    id: string,
    data: {
      nameAr?: string
      cityId?: string
      roomTypes?: {
        id?: string
        nameAr: string
        board: string
        price: number
        currency: string
        imageUrl?: string
        pricings?: {
          validFrom: string
          validTo: string
          price: number
        }[]
      }[]
    }
  ) {
    if (data.roomTypes) {
      validateRoomTypes(data.roomTypes);
    }
    
    // For room types, simplest approach for now is delete all and recreate, 
    // BUT that destroys history/relations if any.
    // Better: upsert/update/delete logic. 
    // Given the form behavior (field array), replacing relations is often expected 
    // unless we track IDs strictly.
    // Let's use a transaction to handle room types cleanup and creation if needed, 
    // OR just basic update for hotel fields and handle room types separately?
    // The previous form logic sends the whole array.
    
    // Simplifed strategy: Update Hotel fields. 
    // For RoomTypes: Delete existing for this hotel and create new ones (simplest for synced state)
    // WARNING: This changes IDs of room types. If they are referenced in Quotations, this is bad.
    // Since this is a "Setup" phase, maybe okay?
    // However, schema says RoomType has relations to RoomPricing and QuotationHotel. 
    // Deleting them will fail if there are dependent records (unless cascading delete is on).
    
    // Let's try to update existing ones by logic or just handle basic fields for now 
    // and recreate new ones.
    // Actually, let's look at how the form behaves. It might not send IDs for new items.
    
    return await prisma.$transaction(async (tx) => {
      const hotel = await tx.hotel.update({
        where: { id },
        data: {
          nameAr: data.nameAr,
          cityId: data.cityId,
        },
      })

      if (data.roomTypes) {
        // Collect IDs from the payload
        const payloadIds = data.roomTypes
          .filter((rt) => rt.id)
          .map((rt) => rt.id as string);

        // 1. Delete removed ones (if they are NOT in the payload)
        // We do this individually to handle potential reference errors gracefully
        const existingRooms = await tx.roomType.findMany({
          where: { hotelId: id },
          select: { id: true }
        });

        for (const existing of existingRooms) {
          if (!payloadIds.includes(existing.id)) {
            try {
              await tx.roomType.delete({ where: { id: existing.id } });
            } catch (e) {
              console.warn(`Could not delete room type ${existing.id} - likely referenced in quotations.`);
            }
          }
        }

        // 2. Update existing or Create new
        for (const rt of data.roomTypes) {
          if (rt.id) {
            await tx.roomPricing.deleteMany({
              where: { roomTypeId: rt.id }
            });

            await tx.roomType.update({
              where: { id: rt.id },
              data: {
                nameAr: rt.nameAr,
                board: rt.board,
                basePrice: rt.price,
                currency: rt.currency as any,
                imageUrl: rt.imageUrl,
                roomPricing: rt.pricings && rt.pricings.length > 0 ? {
                  create: rt.pricings.map(p => ({
                    usage: "dbl",
                    board: rt.board as any,
                    purchasePrice: p.price,
                    sellingPrice: p.price,
                    currency: rt.currency as any,
                    validFrom: new Date(p.validFrom),
                    validTo: new Date(p.validTo)
                  }))
                } : undefined
              },
            })
          } else {
              await tx.roomType.create({
              data: {
                hotelId: id,
                nameAr: rt.nameAr,
                board: rt.board,
                basePrice: rt.price,
                currency: rt.currency as any,
                imageUrl: rt.imageUrl,
                roomPricing: rt.pricings && rt.pricings.length > 0 ? {
                  create: rt.pricings.map(p => ({
                    usage: "dbl",
                    board: rt.board as any,
                    purchasePrice: p.price,
                    sellingPrice: p.price,
                    currency: rt.currency as any,
                    validFrom: new Date(p.validFrom),
                    validTo: new Date(p.validTo)
                  }))
                } : undefined
              },
            })
          }
        }
      }

      return hotel
    })
  },

  async delete(id: string) {
    return await prisma.hotel.delete({
      where: { id },
    })
  },
}
