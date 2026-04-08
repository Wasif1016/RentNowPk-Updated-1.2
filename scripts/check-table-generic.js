const postgres = require('postgres')
require('dotenv').config()

const sql = postgres(process.env.DATABASE_URL.split('?')[0], { prepare: false, ssl: 'require' })

async function check() {
  try {
    const table = process.argv[2] || 'vendor_profiles'
    const cols = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = ${table} AND table_schema = 'public' 
      ORDER BY ordinal_position
    `
    console.log(`=== ${table.toUpperCase()} TABLE COLUMNS ===`)
    cols.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable}, default: ${c.column_default})`)
    })
    
    await sql.end()
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

check()
