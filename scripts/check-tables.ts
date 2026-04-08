
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }
  const cleanUrl = url.split('?')[0];
  console.log('Connecting to:', cleanUrl);
  const sql = postgres(cleanUrl);
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.table(tables);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

main();
