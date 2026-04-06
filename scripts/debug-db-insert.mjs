import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function debug() {
  console.log('🧪 Attempting manual DB insert for voice message...');
  
  // Get a real thread ID from the DB
  const threads = await sql`SELECT id FROM chat_threads LIMIT 1`;
  if (threads.length === 0) {
    console.error('❌ No chat threads found to test with.');
    process.exit(1);
  }
  const threadId = threads[0].id;

  // Get a real user ID
  const users = await sql`SELECT id FROM users LIMIT 1`;
  const userId = users[0].id;

  console.log(`Using thread: ${threadId}, user: ${userId}`);

  try {
    const result = await sql`
      INSERT INTO messages (
        thread_id, 
        sender_id, 
        content, 
        message_type, 
        media_url, 
        audio_duration, 
        created_at
      ) VALUES (
        ${threadId}, 
        ${userId}, 
        NULL, 
        'AUDIO', 
        'https://example.com/test.webm', 
        10, 
        NOW()
      ) RETURNING id;
    `;
    console.log('✅ Success! Inserted ID:', result[0].id);
  } catch (err) {
    console.error('❌ DATABASE ERROR DETECTED:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Detail:', err.detail);
    console.error('Hint:', err.hint);
    console.error('Where:', err.where);
  } finally {
    process.exit(0);
  }
}

debug();
