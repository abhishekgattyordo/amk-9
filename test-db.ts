
import { getPrisma } from './src/lib/prisma';

async function testConnection() {
  const prisma = getPrisma();
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database!');
    const warehouses = await prisma.warehouse.findMany({ take: 1 });
    console.log('Fetched warehouses:', warehouses.length);
    const stocks = await prisma.rawMaterialStock.findMany({ take: 5 });
    console.log('Fetched rawMaterialStocks successfully! Total found:', stocks.length);
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
