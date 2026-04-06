import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

// Transform pooler URL to direct URL if needed (port 6543 -> 5432)
// Example: postgresql://user:pass@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
// Direct: postgresql://user:pass@db.ohdgdplkpngpygxztjuk.supabase.co:5432/postgres
let directUrl = rawUrl.replace(':6543', ':5432').replace('.pooler.supabase.com', '.supabase.co');

// If it's the standard Supabase pooler host, adjust for direct connection
if (directUrl.includes('pooler.supabase.com')) {
  // Extract project ref
  const match = directUrl.match(/postgres\.(.*):/);
  if (match && match[1]) {
    const projectRef = match[1];
    directUrl = directUrl.replace(/@.*:5432/, `@db.${projectRef}.supabase.co:5432`);
  }
}

// Remove pgbouncer=true if present as it's not for direct connections
directUrl = directUrl.replace('pgbouncer=true', '').replace('&&', '&').replace('?&', '?').replace(/\?$/, '');

console.log('🔗 Connecting to DB...');
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
    
    // Also check if they exist now
    const cols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name IN ('message_type', 'media_url', 'audio_duration');
    `;
    console.log('📊 Current columns in "messages":', cols.map(c => c.column_name).join(', '));
    
  } catch (err) {
    console.error('❌ Database error:', err.message);
    if (err.message.includes('already exists')) {
        console.log('ℹ️ Columns already exist, skipping.');
    } else {
        process.exit(1);
    }
  } finally {
    await sql.end();
  }
}

fix();
