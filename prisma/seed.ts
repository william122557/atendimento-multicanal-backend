import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: 'admin@voalzira.com',
      passwordHash,
      subscriptionStatus: 'ACTIVE',
      isActive: true,
    },
  });

  await prisma.product.create({
    data: {
      name: 'Bolo de Cenoura',
      category: 'Tradicional',
      available: true,
      displayOrder: 1,
      sizes: {
        create: [
          { size: 'PEQUENO', available: true },
          { size: 'GRANDE', available: true },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Bolo de Chocolate',
      category: 'Tradicional',
      available: true,
      displayOrder: 2,
      sizes: {
        create: [
          { size: 'PEQUENO', available: true },
          { size: 'GRANDE', available: false },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Bolo de Fubá',
      category: 'Caseiro',
      available: true,
      displayOrder: 3,
      sizes: {
        create: [
          { size: 'PEQUENO', available: false },
          { size: 'GRANDE', available: true },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });