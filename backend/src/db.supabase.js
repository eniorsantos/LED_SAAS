// Adaptador Supabase / PostgreSQL para o backend SaaS LEDs.
// Espelha as operações mais usadas de backend/src/db.js, mas com pg (assíncrono).
// Uso: em src/index.js, substitua `const db = require('./db')` por
// `const db = require('./db.supabase')` quando DATABASE_URL estiver definido.
// Requer: npm install pg
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}
async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}
async function run(sql, params = []) {
  const res = await pool.query(sql, params);
  return res;
}
function prepare(sql) {
  return {
    async run(...params) {
      return run(sql, params);
    },
    async get(...params) {
      return get(sql, params);
    },
    async all(...params) {
      return query(sql, params);
    },
  };
}
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn({
      prepare: (s) => ({
        async run(...p) {
          return await client.query(s, p);
        },
        async get(...p) {
          const r = await client.query(s, p);
          return r.rows[0] || null;
        },
        async all(...p) {
          const r = await client.query(s, p);
          return r.rows;
        },
      }),
    });
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, get, run, prepare, transaction };
