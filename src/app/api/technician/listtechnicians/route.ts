import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getTechnicians() {
  try {
    const technicians = await prisma.technician.findMany();
    return technicians;
  } catch (error) {
    console.error('Error obteniendo los técnicos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Llamada a la función
getTechnicians();
