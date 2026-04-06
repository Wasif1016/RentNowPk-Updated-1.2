import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function check() {
  console.log('🔍 Checking messages table structure...');
  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'messages'
      ORDER BY ordinal_position;
    `;
    console.log('COLUMNS FOUND:');
    columns.forEach(c => {
      console.log(`- ${c.column_name} (${c.data_type}) | Nullable: ${c.is_nullable}`);
    });

    console.log('\n🔍 Checking constraints...');
    const constraints = await sql`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'messages';
    `;
    constraints.forEach(c => {
      console.log(`- ${c.conname}: ${c.pg_get_constraintdef}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

check();
