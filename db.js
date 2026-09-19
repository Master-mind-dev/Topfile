import pkg from 'pg';
import dns from 'dns';
const { Pool } = pkg;

// Force IPv4 — Render does not support IPv6 outbound connections
dns.setDefaultResultOrder('ipv4first');

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
        ? { rejectUnauthorized: false }
        : false,
      // Force IPv4 to avoid ENETUNREACH on Render
      family: 4,
    })
  : null;

if (pool) {
  pool.on('error', (err) => console.error('Unexpected error on idle client', err));
}

export function isDatabaseConfigured() {
  return !!process.env.DATABASE_URL;
}

// Initialize database schema
export async function initializeDatabase() {
  if (!process.env.DATABASE_URL || !pool) {
    console.warn('⚠️ DATABASE_URL is not set. Please set DATABASE_URL in your Render Dashboard Environment Variables.');
    throw new Error('DATABASE_URL environment variable is missing.');
  }

  const client = await pool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        avatar_url TEXT,
        joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        plan VARCHAR(50) DEFAULT 'Personal Pro',
        storage_used_mb FLOAT DEFAULT 0,
        total_storage_mb FLOAT DEFAULT 1024,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(255) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50),
        color_tag VARCHAR(7),
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Images table (uploads)
    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id VARCHAR(255) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        data_url TEXT NOT NULL,
        file_size VARCHAR(50),
        dimensions VARCHAR(50),
        source VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Links table
    await client.query(`
      CREATE TABLE IF NOT EXISTS links (
        id VARCHAR(255) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        title VARCHAR(500),
        description TEXT,
        embed_thumb TEXT,
        link_host VARCHAR(255),
        embed_provider VARCHAR(50),
        embed_id VARCHAR(255),
        is_playable BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for faster queries
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    console.log('✅ Database schema initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

export async function query(text, params) {
  if (!pool) {
    throw new Error('Database is not connected: DATABASE_URL environment variable is missing in Render dashboard.');
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export default pool;
