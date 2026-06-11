import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.VITE_TURSO_URL || 'libsql://filmes-natanoo.aws-us-east-1.turso.io',
  authToken: process.env.VITE_TURSO_TOKEN,
});

async function main() {
  // Check if column already exists
  const check = await turso.execute(
    `SELECT COUNT(*) AS cnt FROM pragma_table_info('users') WHERE name='max_sessions'`
  );
  const hasColumn = Number(check.rows[0].cnt) > 0;

  if (!hasColumn) {
    console.log('Adding max_sessions column...');
    await turso.execute(`ALTER TABLE users ADD COLUMN max_sessions INTEGER NOT NULL DEFAULT 2`);
    console.log('Column added.');
  } else {
    console.log('Column max_sessions already exists.');
  }

  // Create user_sessions table (IF NOT EXISTS makes it idempotent)
  console.log('Creating user_sessions table...');
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Table created.');

  // Create index
  await turso.execute(
    `CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)`
  );
  console.log('Index created.');
  console.log('Migration complete!');
}

main().catch(console.error);
