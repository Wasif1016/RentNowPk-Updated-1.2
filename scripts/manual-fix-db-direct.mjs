import postgres from 'postgres';

// Manual Hardcoded credentials from .env to be 100% sure
const projectRef = 'ohdgdplkpngpygxztjuk';
const user = 'postgres.ohdgdplkpngpygxztjuk';
const pass = '5HgFt3h261Mk2MwO';
const database = 'postgres';
const host = 'aws-1-ap-southeast-2.pooler.supabase.com';
const port = 5432;

const directUrl = `postgresql://${user}:${pass}@${host}:${port}/${database}`;

console.log('🔗 Connecting DIRECTLY to Supabase DB (port 5432)...');
const sql = postgres(directUrl, { ssl: 'require', connect_timeout: 30 });

async function fix() {
  try {
    console.log('🛠️ Adding columns manually to table "messages"...');
    await sql`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'TEXT',
      ADD COLUMN IF NOT EXISTS media_url TEXT,
      ADD COLUMN IF NOT EXISTS audio_duration INTEGER;
    `;
    console.log('✅ Columns added successfully.');
    
    // Check results
    const cols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name IN ('message_type', 'media_url', 'audio_duration');
    `;
    console.log('📊 Current columns in "messages":', cols.map(c => c.column_name).join(', '));
    
  } catch (err) {
    console.error('❌ Database error:', err.message);
  } finally {
    await sql.end();
  }
}

fix();
