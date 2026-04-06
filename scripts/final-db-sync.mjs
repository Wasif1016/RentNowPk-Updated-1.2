import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase (Pooler Mode - Session)...');
// USing the same parameters as src/lib/db/index.ts
const sql = postgres(connectionString, {
    max: 1, 
    // This is the CRITICAL part for Supabase poolers:
    prepare: false, 
    connect_timeout: 30,
    idle_timeout: 20
});

async function run() {
  try {
    console.log('🛠️ Adding columns manually to table "messages"...');
    // Using simple literal strings to avoid any prepared statement issues
    await sql`
      ALTER TABLE public.messages 
      ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'TEXT',
      ADD COLUMN IF NOT EXISTS media_url TEXT,
      ADD COLUMN IF NOT EXISTS audio_duration INTEGER;
    `;
    console.log('✅ Columns added (or already existed).');
    
    // Now VERIFY their existence to satisfy the user
    const check = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'messages' 
          AND column_name IN ('message_type', 'media_url', 'audio_duration');
    `;
    
    console.log('📊 Actual Columns found in DB:');
    check.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));
    
    const foundCount = check.length;
    if (foundCount === 3) {
        console.log('✨ SUCCESS: All 3 columns are present and confirmed.');
    } else {
        console.warn(`⚠️ WARNING: Found ${foundCount}/3 columns. Something might be wrong.`);
    }

  } catch (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
