const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function check() {
  console.log('🔍 Checking messages table structure...');
  try {
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND table_schema = 'public';
    `;
    console.log('COLS:' + columns.map(c => c.column_name).join(','));
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

check();
