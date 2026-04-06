const postgres = require('postgres')
require('dotenv').config()

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require' })

async function fix() {
  try {
    console.log('Fixing messages.content column to allow NULL...')
    
    // Check current state
    const cols = await sql`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND table_schema = 'public' AND column_name = 'content'
    `
    
    if (cols.length === 0) {
      console.error('content column not found!')
      process.exit(1)
    }
    
    console.log(`Current content column - nullable: ${cols[0].is_nullable}`)
    
    if (cols[0].is_nullable === 'NO') {
      await sql`ALTER TABLE messages ALTER COLUMN content DROP NOT NULL`
      console.log('Successfully made content column nullable')
      
      // Verify
      const verify = await sql`
        SELECT is_nullable FROM information_schema.columns 
        WHERE table_name = 'messages' AND table_schema = 'public' AND column_name = 'content'
      `
      console.log(`Verified - nullable: ${verify[0].is_nullable}`)
    } else {
      console.log('content column is already nullable - no change needed')
    }
    
    await sql.end()
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

fix()
