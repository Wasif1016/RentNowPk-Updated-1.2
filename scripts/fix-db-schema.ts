import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env') })

async function main() {
  console.log('Adding missing Columns to messages table manually...')
  try {
    await db.execute(sql`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'TEXT',
      ADD COLUMN IF NOT EXISTS media_url TEXT,
      ADD COLUMN IF NOT EXISTS audio_duration INTEGER;
    `)
    console.log('✅ Schema updated successfully.')
  } catch (err) {
    console.error('❌ Failed to update schema:', err)
    process.exit(1)
  }
}

main()
