const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      userRoles: {
        create: {
          role: 'admin',
        },
      },
      employee: {
        create: {
          nameAr: 'المدير العام',
          email,
          initial: 'AD',
        },
      },
    },
  });

  console.log(`Created admin user: ${email} / ${password}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
