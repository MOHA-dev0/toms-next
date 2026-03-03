import { PrismaClient, Currency, RoomUsage, BoardType, QuotationStatus, BookingStatus, VoucherType, SourceType, AppRole } from '@prisma/client'
import { fakerEN, fakerAR } from '@faker-js/faker'

const prisma = new PrismaClient()

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  console.log('-------------------------------------------')
  console.log('1. Clearing old database records (Except Users/Employees)...')
  
  await prisma.voucher.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.quotationPassenger.deleteMany()
  await prisma.quotationHotel.deleteMany()
  await prisma.quotationService.deleteMany()
  await prisma.quotationFlight.deleteMany()
  await prisma.quotationCar.deleteMany()
  await prisma.quotationItinerary.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.roomPricing.deleteMany()
  await prisma.roomType.deleteMany()
  await prisma.hotel.deleteMany()
  await prisma.service.deleteMany()
  await prisma.otherService.deleteMany()
  await prisma.serviceProvider.deleteMany()
  await prisma.city.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.company.deleteMany()

  console.log('Database cleared.')

  // 2. Retrieve or Create Admin user
  let employee = await prisma.employee.findFirst()
  if (!employee) {
    const user = await prisma.user.create({
      data: {
        email: fakerEN.internet.email(),
        password: 'password', 
        userRoles: { create: { role: AppRole.admin } },
        employee: {
          create: {
            nameAr: fakerAR.person.fullName(),
            email: fakerEN.internet.email(),
            initial: 'ADM',
          }
        }
      },
      include: { employee: true }
    })
    employee = user.employee!
  }

  // 3. Create Companies and Agents
  console.log('2. Generating Companies and Agents...')
  const companies = []
  for(let i=0; i<5; i++) {
    const comp = await prisma.company.create({
      data: {
        nameEn: `${fakerEN.company.name()} Corp`,
        isActive: true
      }
    })
    companies.push(comp)
  }

  const agents = []
  for(let i=0; i<10; i++) {
    const ag = await prisma.agent.create({
      data: {
        nameEn: `${fakerEN.company.name()} Travel Agent`,
        isActive: true
      }
    })
    agents.push(ag)
  }

  // 4. Create Cities
  console.log('3. Generating Cities...')
  const citiesData = [
    { ar: 'إسطنبول', en: 'Istanbul' },
    { ar: 'أنطاليا', en: 'Antalya' },
    { ar: 'بودروم', en: 'Bodrum' },
    { ar: 'طرابزون', en: 'Trabzon' },
    { ar: 'بورصة', en: 'Bursa' },
    { ar: 'كابادوكيا', en: 'Cappadocia' },
    { ar: 'مرمريس', en: 'Marmaris' }
  ]
  const cities = []
  for (const c of citiesData) {
    const city = await prisma.city.create({
      data: {
        nameAr: c.ar,
        nameTr: c.en,
        countryAr: 'تركيا',
        countryTr: 'Turkey'
      }
    })
    cities.push(city)
  }

  // 5. Create Service Providers & Services
  console.log('4. Generating Service Providers and Services...')
  const serviceProviders = []
  for(let i=0; i<5; i++) {
    const sp = await prisma.serviceProvider.create({
      data: {
        name: `${fakerEN.company.name()} Tourism & Transfers`,
      }
    })
    serviceProviders.push(sp)
  }

  const services = []
  const serviceNames = [
    { ar: 'استقبال من المطار', en: 'Airport VIP Transfer' },
    { ar: 'جولة سياحية خاصة', en: 'Private City Tour' },
    { ar: 'تذاكر متحف', en: 'Museum Pass Ticket' },
    { ar: 'سهرة عشاء', en: 'Bosphorus Dinner Cruise' },
    { ar: 'مرشد سياحي', en: 'Private Tour Guide' },
  ]
  for (const sn of serviceNames) {
    const s = await prisma.service.create({
      data: {
        cityId: getRandomItem(cities).id,
        nameAr: sn.ar,
        nameEn: sn.en,
        descriptionAr: `وصف خدمة ${sn.ar}`,
        descriptionEn: `High quality ${sn.en} service`,
        purchasePrice: getRandomInt(20, 100),
        currency: Currency.USD
      }
    })
    services.push(s)
  }

  // 6. Create 30 Hotels in English
  console.log('5. Generating 30 Hotels and Room Types (English)...')
  const hotels = []
  for (let i = 0; i < 30; i++) {
    const city = getRandomItem(cities)
    const hotel = await prisma.hotel.create({
      data: {
        cityId: city.id,
        nameAr: `${fakerEN.company.name()} Hotel & Spa`, // English names populated
        nameTr: `${fakerEN.company.name()} Hotel & Spa`,
        addressAr: fakerEN.location.streetAddress(),
        addressTr: fakerEN.location.streetAddress(),
        stars: getRandomInt(3, 5),
        phone: fakerEN.phone.number(),
        email: fakerEN.internet.email()
      }
    })
    hotels.push(hotel)
  }

  // 7. Create Room Types and Pricing 
  const usages: RoomUsage[] = [RoomUsage.sgl, RoomUsage.dbl, RoomUsage.tpl]
  const boards: BoardType[] = [BoardType.bb, BoardType.fb, BoardType.hb, BoardType.ro]
  const allRoomTypes = []

  const roomTypeNames = [
    { en: 'Standard Sea View', ar: 'Standard Sea View' },
    { en: 'Deluxe City View', ar: 'Deluxe City View' },
    { en: 'Executive Suite', ar: 'Executive Suite' },
    { en: 'Family Connected Room', ar: 'Family Connected Room' }
  ]

  for (const hotel of hotels) {
    const numRooms = getRandomInt(2, 4)
    for (let i = 0; i < numRooms; i++) {
      const rtType = roomTypeNames[i % roomTypeNames.length]
      
      const roomType = await prisma.roomType.create({
        data: {
          hotelId: hotel.id,
          nameAr: rtType.en, // English names populated throughout
          nameTr: rtType.en,
          maxOccupancy: getRandomInt(2, 5),
          basePrice: getRandomInt(80, 400),
          currency: Currency.USD
        }
      })
      allRoomTypes.push({ ...roomType, hotel })

      for (let season = 0; season < 3; season++) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30 + (season * 60)) 
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 59)

        const purchasePrice = Number(roomType.basePrice || 100) + getRandomInt(-10, 50)
        const sellingPrice = purchasePrice * 1.30 // 30% markup

        await prisma.roomPricing.create({
          data: {
            roomTypeId: roomType.id,
            usage: getRandomItem(usages),
            board: getRandomItem(boards),
            purchasePrice,
            sellingPrice,
            currency: Currency.USD,
            validFrom: startDate,
            validTo: endDate
          }
        })
      }
    }
  }

  // 8. Create 100 Customers
  console.log('6. Generating Customers...')
  const customers = []
  for (let i = 0; i < 100; i++) {
    const customer = await prisma.customer.create({
      data: {
        nameAr: fakerEN.person.fullName(), // English names
        email: fakerEN.internet.email(),
        phone: fakerEN.phone.number(),
        nationality: 'Saudi Arabia',
        passportNumber: fakerEN.string.alphanumeric(9).toUpperCase(),
        createdBy: employee.id
      }
    })
    customers.push(customer)
  }

  // 9. Create 200+ Quotations with full features (Hotels, Flights, Cars, Services, Agents, Companies)
  console.log('7. Generating ~250 Full Quotations (Hotels, Flights, Cars, Services, Agents/Companies)...')
  let confirmedCount = 0
  
  for (let i = 0; i < 250; i++) {
    const isConfirmed = confirmedCount < 200 ? true : Math.random() > 0.5
    if (isConfirmed && confirmedCount < 200) confirmedCount++

    const status: QuotationStatus = isConfirmed ? QuotationStatus.confirmed : (Math.random() > 0.5 ? QuotationStatus.draft : QuotationStatus.sent)
    const customer = getRandomItem(customers)
    
    // Assign Agent or Company optionally
    const hasAgent = Math.random() > 0.5;
    const hasCompany = !hasAgent && Math.random() > 0.8; 
    const agentId = hasAgent ? getRandomItem(agents).id : null;
    const companyId = hasCompany ? getRandomItem(companies).id : null;
    const source: SourceType = (hasAgent || hasCompany) ? SourceType.b2b : SourceType.b2c;

    // Core details
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + getRandomInt(5, 60))
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + getRandomInt(4, 12))
    const nights = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Components
    const randomRoom = getRandomItem(allRoomTypes)
    const randomService = getRandomItem(services)
    const randomProvider = getRandomItem(serviceProviders)
    
    // Hotel Math
    const hPurchasePrice = Number(randomRoom.basePrice || 100)
    const hSellingPrice = hPurchasePrice * 1.25
    const hotelSubtotal = hSellingPrice * nights
    
    // Flight Math
    const fPrice = getRandomInt(150, 400)
    const passengersCount = getRandomInt(2, 4)
    const flightSubtotal = fPrice * passengersCount

    // Car Math
    const carPricePerDay = getRandomInt(50, 150)
    const carSubtotal = carPricePerDay * nights
    
    // Service Math
    const sPurchasePrice = Number(randomService.purchasePrice || 30)
    const sSellingPrice = sPurchasePrice * 1.40
    const serviceSubtotal = sSellingPrice * 1 // qty 1

    // Overall Math
    const actualSubtotal = hotelSubtotal + flightSubtotal + carSubtotal + serviceSubtotal
    const profit = actualSubtotal * 0.18 // 18% overall profit margin
    const commissionAmount = hasAgent ? profit * 0.1 : 0; // if it has agent, give a bit of commission
    const totalPrice = actualSubtotal + profit + commissionAmount

    // Quotation Create (Atomic Tree)
    const quotation = await prisma.quotation.create({
      data: {
        referenceNumber: `QT-2024-${getRandomInt(100000, 999999)}`,
        customerId: customer.id,
        salesEmployeeId: employee.id,
        agentId,
        companyId,
        source,
        destinationCityId: randomRoom.hotel.cityId,
        status,
        startDate,
        endDate,
        adults: passengersCount,
        children: 0,
        subtotal: actualSubtotal,
        profit,
        commissionAmount,
        totalPrice,
        paidAmount: isConfirmed ? totalPrice : 0,
        
        quotationHotels: {
          create: {
            hotelId: randomRoom.hotelId,
            roomTypeId: randomRoom.id,
            checkIn: startDate,
            checkOut: endDate,
            nights,
            roomsCount: 1,
            usage: RoomUsage.dbl,
            board: BoardType.bb,
            purchasePrice: hPurchasePrice,
            sellingPrice: hSellingPrice,
          }
        },
        quotationFlights: {
          create: {
            description: `${fakerEN.airline.airline().name} Flight: DXB -> IST - Direct`,
            flightType: 'international',
            departureDate: startDate,
            passengers: passengersCount,
            price: fPrice,
            currency: Currency.USD,
            totalAmount: flightSubtotal
          }
        },
        quotationCars: {
          create: {
            pickupDate: startDate,
            dropoffDate: endDate,
            days: nights,
            description: `Mercedes Vito VIP - 7 Seats`,
            pricePerDay: carPricePerDay,
            currency: Currency.USD,
            totalAmount: carSubtotal
          }
        },
        quotationServices: {
          create: {
            serviceId: randomService.id,
            providerId: randomProvider.id,
            nameAr: randomService.nameEn || 'Service', 
            descriptionAr: `Confirmed booking for ${randomService.nameEn}`,
            descriptionEn: `Confirmed booking for ${randomService.nameEn}`,
            quantity: 1,
            purchasePrice: sPurchasePrice,
            sellingPrice: sSellingPrice,
            serviceDate: startDate
          }
        },
        passengers: {
          create: Array.from({ length: passengersCount }).map((_, idx) => ({
            name: idx === 0 ? customer.nameAr : fakerEN.person.fullName(),
            type: idx === 0 ? 'adult' : getRandomItem(['adult', 'child'])
          }))
        }
      }
    })

    if (isConfirmed) {
      const booking = await prisma.booking.create({
        data: {
          referenceNumber: `BK-${new Date().getFullYear()}-${getRandomInt(100000, 999999)}`,
          quotationId: quotation.id,
          bookingEmployeeId: employee.id,
          status: BookingStatus.confirmed,
          confirmedAt: new Date()
        }
      })

      // Generate a voucher for the hotel
      await prisma.voucher.create({
        data: {
          bookingId: booking.id,
          voucherType: VoucherType.hotel,
          voucherCode: `VCH-${getRandomInt(100000, 999999)}`,
          hotelId: randomRoom.hotelId,
          guestNameAr: customer.nameAr,
          guestNameTr: fakerEN.person.fullName(),
          checkIn: startDate,
          checkOut: endDate,
          roomTypeAr: randomRoom.nameAr,
          roomTypeTr: randomRoom.nameTr,
          boardAr: 'BB',
          boardTr: 'Bed & Breakfast',
          createdBy: employee.id
        }
      })
      
      // Payment
      await prisma.payment.create({
        data: {
           quotationId: quotation.id,
           customerId: customer.id,
           amount: totalPrice,
           paymentMethod: getRandomItem(["Cash", "Credit Card", "Bank Transfer"]),
           paymentDate: new Date(),
           createdBy: employee.id
        }
      })
    }
  }

  console.log('-------------------------------------------')
  console.log('✅ Successfully completely erased old data and cleanly seeded robust realistic English data with:')
  console.log('- Companies and Agents (assigned to Quotations!)')
  console.log('- Flights')
  console.log('- Cars')
  console.log('- Services / Providers')
  console.log('- Hotels / English Room Types & Pricing Seasons')
  console.log('- Passengers')
  console.log('- ~250 Quotations & >200 Confirmed Bookings')
}

main().catch(err => {
  console.error("Error seeding realistic data:", err)
}).finally(() => {
  prisma.$disconnect()
})
