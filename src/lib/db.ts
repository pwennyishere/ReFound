import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

interface QueryResult {
  rows: any[];
  rowCount: number;
}

// Simple query helper that mimics our SQLite API
async function query(sqlQuery: string, ...params: any[]): Promise<QueryResult> {
  // Convert ? placeholders to $1, $2 etc.
  let idx = 0;
  const pgSql = sqlQuery.replace(/\?/g, () => `$${++idx}`);
  // Handle datetime('now') -> NOW()
  const finalSql = pgSql
    .replace(/datetime\('now'\)/g, "NOW()")
    .replace(/datetime\('now'/g, "NOW()");
  const result = (await sql.query(finalSql, params)) as unknown as QueryResult;
  return result;
}

const db = {
  // Returns all rows
  async all(sql: string, ...params: any[]) {
    const result = await query(sql, ...params);
    return (result.rows || result) as any[];
  },

  // Returns first row or null
  async get(sql: string, ...params: any[]) {
    const result = await query(sql, ...params);
    const rows = result.rows || result;
    return (rows[0] || null) as any;
  },

  // Execute and return info
  async run(sql: string, ...params: any[]) {
    const isInsert = sql.trim().toUpperCase().startsWith("INSERT");
    const finalSql = isInsert ? sql + " RETURNING id" : sql;
    const result = await query(finalSql, ...params);
    const rows = result.rows || result;
    return {
      lastInsertRowid: rows[0]?.id || null,
      changes: Array.isArray(rows) ? rows.length : 0,
    };
  },

  // Transaction helper
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    // Neon serverless handles transactions via the connection
    return await fn();
  },
};

// Initialize tables
async function initDb() {
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      is_simple_mode INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      seller_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      images TEXT DEFAULT '[]',
      category TEXT DEFAULT 'Other',
      condition TEXT DEFAULT 'Good',
      is_auction INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      sold_at TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS auctions (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL UNIQUE REFERENCES items(id),
      starting_bid REAL NOT NULL,
      current_bid REAL NOT NULL,
      bidder_id INTEGER REFERENCES users(id),
      ends_at TIMESTAMP NOT NULL,
      is_active INTEGER DEFAULT 1,
      winner_id INTEGER REFERENCES users(id)
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS bids (
      id SERIAL PRIMARY KEY,
      auction_id INTEGER NOT NULL REFERENCES auctions(id),
      bidder_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      item_id INTEGER NOT NULL REFERENCES items(id),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(reviewer_id, item_id)
    )
  `);
}

// Init on startup
initDb().catch((e) => console.error("DB init error:", e));

export default db;
