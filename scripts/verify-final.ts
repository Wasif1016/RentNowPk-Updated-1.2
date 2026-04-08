
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not defined');
    return;
  }
  const url = databaseUrl.split('?')[0];
  const sql = postgres(url);
  try {
    const columns = await sql`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('messages', 'booking_offers') 
      AND table_schema = 'public'
    `;
    console.table(columns);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

main();
