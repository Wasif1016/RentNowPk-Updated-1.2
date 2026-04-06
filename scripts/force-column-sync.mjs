import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Ensure we use the connection string but with direct parameters if possible
// to bypass pooler transaction caching.
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function sync() {
  console.log('🚀 FORCING DATABASE COLUMN SYNC...');
  try {
    // 1. Add columns to public.messages using double quotes for safety
    await sql`
      ALTER TABLE "messages" 
      ADD COLUMN IF NOT EXISTS "message_type" TEXT NOT NULL DEFAULT 'TEXT';
    `;
    console.log('✅ Column "message_type" sync complete.');

    await sql`
      ALTER TABLE "messages" 
      ADD COLUMN IF NOT EXISTS "media_url" TEXT;
    `;
    console.log('✅ Column "media_url" sync complete.');

    await sql`
      ALTER TABLE "messages" 
      ADD COLUMN IF NOT EXISTS "audio_duration" INTEGER;
    `;
    console.log('✅ Column "audio_duration" sync complete.');

    // 2. Final check
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND table_schema = 'public';
    `;
    console.log('Current Columns:', columns.map(c => c.column_name).join(', '));

  } catch (err) {
    console.error('❌ MIGRATION FAILED:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Detail:', err.detail);
  } finally {
    process.exit(0);
  }
}

sync();
