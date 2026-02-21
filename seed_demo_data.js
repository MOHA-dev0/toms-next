const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // 1. Create Cities
  const cities = [
    { nameAr: 'إسطنبول', nameTr: 'Istanbul', countryAr: 'تركيا' },
    { nameAr: 'طرابزون', nameTr: 'Trabzon', countryAr: 'تركيا' },
    { nameAr: 'بورصة', nameTr: 'Bursa', countryAr: 'تركيا' },
    { nameAr: 'انطاليا', nameTr: 'Antalya', countryAr: 'تركيا' },
  ];

  const cityMap = {};
  for (const city of cities) {
    const c = await prisma.city.create({ data: city });
    cityMap[c.nameTr] = c.id;
    console.log(`Created city: ${city.nameAr}`);
  }

  // 2. Create Companies & Agents
  await prisma.company.create({ data: { nameEn: 'Demo Company LLC' } });
  await prisma.agent.create({ data: { nameEn: 'Best Travel Agent' } });
  console.log('Created Companies & Agents');

  // 3. Create Additional Employees (Sales)
  const salesEmail = 'sales@example.com';
  const existingSales = await prisma.user.findUnique({ where: { email: salesEmail } });
  if (!existingSales) {
      const password = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: salesEmail,
          password,
          userRoles: { create: { role: 'sales' } },
          employee: {
            create: { nameAr: 'موظف مبيعات', email: salesEmail, initial: 'SA' }
          }
        }
      });
      console.log('Created Sales Employee');
  }

  // 4. Create Hotels (Istanbul)
  const istanbulId = cityMap['Istanbul'];
  if (istanbulId) {
      const hotel = await prisma.hotel.create({
          data: {
              cityId: istanbulId,
              nameAr: 'فندق تقسيم سكوير',
              nameTr: 'Taksim Square Hotel',
              stars: 4,
              isActive: true
          }
      });

      // Room Types
      const roomType = await prisma.roomType.create({
          data: {
              hotelId: hotel.id,
              nameAr: 'غرفة قياسية',
              nameTr: 'Standard Room',
              maxOccupancy: 2,
              basePrice: 100,
              currency: 'USD'
          }
      });

      // Room Pricing
      await prisma.roomPricing.create({
          data: {
              roomTypeId: roomType.id,
              usage: 'dbl',
              board: 'bb',
              purchasePrice: 80,
              sellingPrice: 100,
              currency: 'USD',
              validFrom: new Date('2024-01-01'),
              validTo: new Date('2026-12-31')
          }
      });
      console.log('Created Hotel in Istanbul');
  }

  // 5. Create Services
  if (istanbulId) {
      await prisma.service.createMany({
          data: [
              { cityId: istanbulId, nameAr: 'جولة فلوريال', purchasePrice: 30, currency: 'USD' },
              { cityId: istanbulId, nameAr: 'جولة بوسفور', purchasePrice: 40, currency: 'USD' },
              { cityId: istanbulId, nameAr: 'توصيل مطار', purchasePrice: 25, currency: 'USD' }
          ]
      });
      console.log('Created Services for Istanbul');
  }

  // 6. Create Other Services
  await prisma.otherService.createMany({
      data: [
          { nameAr: 'تأمين سفر', nameEn: 'Travel Insurance', purchasePrice: 15, currency: 'USD' },
          { nameAr: 'شريحة اتصال', nameEn: 'Sim Card', purchasePrice: 20, currency: 'USD' },
          { nameAr: 'وجبة عشاء فاخرة', nameEn: 'Gala Dinner', purchasePrice: 50, currency: 'USD' }
      ]
  });
  console.log('Created Other Services');

  // 7. Create Customer
  await prisma.customer.create({
      data: {
          nameAr: 'عميل تجريبي',
          phone: '0555555555',
          email: 'customer@example.com',
          nationality: 'Saudi'
      }
  });
  console.log('Created Demo Customer');

  console.log('Seeding completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
