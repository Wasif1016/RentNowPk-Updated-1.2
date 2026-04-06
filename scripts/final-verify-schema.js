const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function check() {
  console.log('🔍 Final Verification of Database Schema...');
  try {
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND table_schema = 'public';
    `;
    const colList = columns.map(c => c.column_name);
    console.log('COLUMNS FOUND:', colList.join(', '));
    
    const missing = ['message_type', 'media_url', 'audio_duration'].filter(c => !colList.includes(c));
    if (missing.length === 0) {
      console.log('✅ All columns are present in the current DATABASE_URL connection.');
    } else {
      console.log('❌ MISSING COLUMNS:', missing.join(', '));
    }
  } catch (err) {
    console.error('❌ Error during check:', err.message);
  } finally {
    process.exit(0);
  }
}

check();
