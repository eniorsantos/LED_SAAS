// Camada de abstração unificada para SQLite e PostgreSQL/Supabase.
// Detecta automaticamente DATABASE_URL e escolhe o driver apropriado.
// Quando DATABASE_URL está definido: usa pg (assíncrono).
// Quando não está: usa better-sqlite3 (síncrono).
//
// Uso: em src/index.js, substitua `const db = require('./db')` por
// `const db = require('./db.adapter')`. Todas as rotas devem ser async
// e usar await nas chamadas a db.prepare(...).run()/get()/all().

const USING_POSTGRES = !!process.env.DATABASE_URL;

let db;
if (USING_POSTGRES) {
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
    return pool.query(sql, params);
  }
  function prepare(sql) {
    return {
      async run(...params) {
        return pool.query(sql, params);
      },
      async get(...p) {
        const r = await pool.query(sql, p);
        return r.rows[0] || null;
      },
      async all(...p) {
        const r = await pool.query(sql, p);
        return r.rows;
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
  db = { pool, query, get, run, prepare, transaction, isUsingPostgres: () => true };
} else {
  // SQLite: envolve o db existente de db.js (que já criou as tabelas)
  const sqliteDb = require('./db');
  db = {
    ...sqliteDb,
    prepare: (sql) => sqliteDb.prepare(sql),
    run: (sql, params = []) => sqliteDb.prepare(sql).run(...params),
    get: (sql, params = []) => sqliteDb.prepare(sql).get(...params),
    all: (sql, params = []) => sqliteDb.prepare(sql).all(...params),
    transaction: (fn) => {
      // SQLite: sqliteDb.transaction() é síncrono e não suporta async/await dentro
      // do callback. Executa a função diretamente; cada statement é auto-commitado
      // pelo better-sqlite3.
      return async () => {
        return await fn();
      };
    },
    isUsingPostgres: () => false,
  };
}

db.USING_POSTGRES = USING_POSTGRES;
db.isUsingPostgres = () => USING_POSTGRES;

module.exports = db;
