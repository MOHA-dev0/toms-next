const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      password: true
    }
  });
  
  console.log("Users found:", users.length);
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`Password starts with $: ${u.password.startsWith('$')}`);
    console.log(`Password length: ${u.password.length}`);
  });
}

main()
  .catch(e => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
