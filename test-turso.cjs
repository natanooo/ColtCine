const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const turso = createClient({
  url: 'libsql://filmes-natanoo.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODEwNDc2NTMsImlkIjoiMDE5ZWFlYTQtNDAwMS03NGRiLTg3ZjUtMzU0ZjE4NTYyZmU2IiwicmlkIjoiYWIyNmJlYTAtOTYyOC00MzI3LTkyOGQtOGQwNGQxODMxNDk2In0.cHjyHFJ-jZAzl-FtsRK-1_egNpFJv72NVeHoMNc7T7Kfhbh46HbSkr8E4m2Vf2xjx9hBTaoyBWy8Mjp3bqzzAQ'
});

async function main() {
  const tables = await turso.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tabelas:', tables.rows.map(r => r.name).join(', '));

  if (tables.rows.some(r => r.name === 'users')) {
    const users = await turso.execute('SELECT id, name, email, role, status FROM users');
    console.log('\nUsuários:', JSON.stringify(users.rows));
    if (users.rows.length > 0) {
      console.log('\n✅ Admin encontrado!');
      console.log('Email:', users.rows[0].email);
      console.log('Senha: admin123');
      process.exit(0);
    }
  }

  // Create schema
  console.log('\nCriando tabelas...');
  const schema = fs.readFileSync('database/schema.sql', 'utf8');
  const statements = schema.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    try { await turso.execute(stmt.trim() + ';'); } catch(e) {}
  }

  // Create admin
  const hash = bcrypt.hashSync('admin123', 10);
  const rs = await turso.execute({
    sql: "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id, name, email, role",
    args: ['Admin', 'admin@cineverse.com', hash, 'admin']
  });
  console.log('Admin criado:', JSON.stringify(rs.rows[0]));

  const uid = rs.rows[0].id;
  await turso.execute({
    sql: "INSERT INTO permissions (user_id, can_watch_movies, can_watch_series, can_download, can_use_favorites, can_use_watchlist, vip_access) VALUES (?, 1, 1, 1, 1, 1, 1)",
    args: [uid]
  });
  console.log('Permissões criadas.');

  console.log('\n✅ Login do Admin:');
  console.log('Email: admin@cineverse.com');
  console.log('Senha: admin123');
}

main().catch(err => console.log('Erro:', err.message || err));
