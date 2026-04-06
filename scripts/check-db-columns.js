const postgres = require('postgres')
require('dotenv').config()

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require' })

async function check() {
  try {
    const cols = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND table_schema = 'public' 
      ORDER BY ordinal_position
    `
    console.log('=== MESSAGES TABLE COLUMNS ===')
    cols.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable}, default: ${c.column_default})`)
    })
    
    // Check specifically for the voice columns
    const hasMessageType = cols.some(c => c.column_name === 'message_type')
    const hasMediaUrl = cols.some(c => c.column_name === 'media_url')
    const hasAudioDuration = cols.some(c => c.column_name === 'audio_duration')
    
    console.log('\n=== VOICE COLUMNS CHECK ===')
    console.log(`  message_type: ${hasMessageType ? 'EXISTS' : 'MISSING'}`)
    console.log(`  media_url: ${hasMediaUrl ? 'EXISTS' : 'MISSING'}`)
    console.log(`  audio_duration: ${hasAudioDuration ? 'EXISTS' : 'MISSING'}`)
    
    if (!hasMessageType || !hasMediaUrl || !hasAudioDuration) {
      console.log('\n=== ADDING MISSING COLUMNS ===')
      try {
        await sql`
          ALTER TABLE messages 
          ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'TEXT',
          ADD COLUMN IF NOT EXISTS media_url TEXT,
          ADD COLUMN IF NOT EXISTS audio_duration INTEGER
        `
        console.log('  Columns added successfully')
        
        // Verify
        const verify = await sql`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'messages' AND table_schema = 'public'
        `
        const names = verify.map(c => c.column_name)
        console.log('  Verified columns:', names.join(', '))
      } catch (err) {
        console.error('  Failed to add columns:', err.message)
      }
    } else {
      console.log('\nAll voice columns exist. No action needed.')
    }
    
    await sql.end()
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

check()
