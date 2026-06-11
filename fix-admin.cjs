const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const turso = createClient({
  url: 'libsql://filmes-natanoo.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODEwNDc2NTMsImlkIjoiMDE5ZWFlYTQtNDAwMS03NGRiLTg3ZjUtMzU0ZjE4NTYyZmU2IiwicmlkIjoiYWIyNmJlYTAtOTYyOC00MzI3LTkyOGQtOGQwNGQxODMxNDk2In0.cHjyHFJ-jZAzl-FtsRK-1_egNpFJv72NVeHoMNc7T7Kfhbh46HbSkr8E4m2Vf2xjx9hBTaoyBWy8Mjp3bqzzAQ'
});

async function main() {
  const hash = bcrypt.hashSync('admin123', 10);
  console.log('Novo hash gerado:', hash);

  // Fix admin user - update email and password
  await turso.execute({
    sql: "UPDATE users SET email = ?, password_hash = ?, updated_at = datetime('now') WHERE role = 'admin'",
    args: ['admin@cineverse.com', hash]
  });

  const rs = await turso.execute({
    sql: "SELECT id, name, email, role, status FROM users WHERE role = 'admin'",
    args: []
  });

  console.log('\n✅ Admin atualizado:');
  console.log(JSON.stringify(rs.rows[0], null, 2));
  console.log('\n📧 Email: admin@cineverse.com');
  console.log('🔑 Senha: admin123');
}

main().catch(err => console.log('Erro:', err.message || err));
