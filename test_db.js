require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting database connection with:", process.env.DATABASE_URL?.split('@')[1] || "No DATABASE_URL found");
    await prisma.$connect();
    // Run a simple query to guarantee it works
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    if (result && result.length > 0) {
        console.log('Database connected and query executed successfully!');
        console.log('Query output:', result[0]);
    } else {
        console.log('Connected, but query returned unexpected result.');
    }
  } catch (e) {
    console.error('Database connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
