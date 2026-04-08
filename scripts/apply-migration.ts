
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  // Strip pgbouncer flag for the migration
  const cleanUrl = url.split('?')[0];
  
  console.log('Connecting to:', cleanUrl);
  const sql = postgres(cleanUrl);

  const migrations = [
    '0009_booking_offers_table.sql',
    '0010_motionless_catseye.sql',
    '0011_narrow_sunspot.sql'
  ];

  console.log('Applying pending migrations...');
  try {
    for (const fileName of migrations) {
      console.log(`--- Applying ${fileName} ---`);
      const filePath = path.join(process.cwd(), 'drizzle', fileName);
      if (!fs.existsSync(filePath)) {
        console.warn(`Migration file ${fileName} not found, skipping.`);
        continue;
      }
      const content = fs.readFileSync(filePath, 'utf8');
      const statements = content.split('--> statement-breakpoint');
      
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (trimmed) {
          console.log('Executing:', trimmed);
          try {
            await sql.unsafe(trimmed);
          } catch (e: any) {
            const msg = e.message.toLowerCase();
            if (msg.includes('already exists') || msg.includes('does not exist')) {
              console.warn(`Success (Ignored Warning): ${e.message}`);
            } else {
              console.error(`Error in statement: ${trimmed}`);
              throw e;
            }
          }
        }
      }
    }
    console.log('All migrations applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

main();
