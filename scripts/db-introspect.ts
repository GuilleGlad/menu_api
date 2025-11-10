// Simple CommonJS script to list public tables.
// Use via: node scripts/db-introspect.js (after transpile) or ts-node scripts/db-introspect.ts
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: +(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '12345',
    database: process.env.PGDATABASE || 'postgresV2',
  });
  await client.connect();
  const res = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`,
  );
  console.log('\nPublic schema tables:\n');
  res.rows.forEach((r) => console.log('- ' + r.table_name));
  await client.end();
}

main().catch((e) => {
  console.error('Introspection error:', e);
  process.exit(1);
});
