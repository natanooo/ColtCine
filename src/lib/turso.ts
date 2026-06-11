import { createClient } from '@libsql/client'

export const turso = createClient({
  url: import.meta.env.VITE_TURSO_URL || 'http://127.0.0.1:8080',
  authToken: import.meta.env.VITE_TURSO_TOKEN,
})

export async function initDatabase() {
  const schema = await fetch('/schema.sql').then(r => r.text())
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
  for (const stmt of statements) {
    await turso.execute(stmt)
  }
}
