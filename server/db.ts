import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Determine SSL configuration based on DATABASE_URL
const shouldUseSSL = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  const explicitSSL = process.env.DATABASE_SSL;
  
  if (explicitSSL === 'true') return { rejectUnauthorized: false };
  if (explicitSSL === 'false') return false;
  
  // Only use SSL in production for known cloud databases
  if (process.env.NODE_ENV === 'production') {
    if (dbUrl.includes('supabase.co') || dbUrl.includes('neon.tech') || dbUrl.includes('supabase.com')) {
      return { rejectUnauthorized: false };
    }
  }
  
  // Development or unrecognized - no SSL
  return false;
};

// Create connection pool with proper configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSSL(),
  // Keep pool small for Supabase (max 3-5 direct connections)
  max: 3,
  // Release idle connections after 10 minutes (prevent stale connections)
  idleTimeoutMillis: 600000,
  // Timeout for acquiring a connection from pool
  connectionTimeoutMillis: 15000,
  // TCP keepalive — prevents firewall/NAT from dropping idle connections
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Allow reconnection on connection errors
  allowExitOnIdle: false,
});

export const db = drizzle(pool, { schema });

// Log successful new connections
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

// On pool-level errors, log but don't crash — pool will reconnect automatically
pool.on('error', (err) => {
  console.error('❌ Database pool error (will reconnect):', err.message);
});

// ─── Periodic Health Check ────────────────────────────────────────────────────
// Runs every 5 minutes to keep the connection alive.
// This also prevents Supabase free-tier from pausing after 7 days inactivity.
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function runHealthCheck() {
  try {
    await pool.query('SELECT 1');
  } catch (err: any) {
    console.warn('⚠️  Database health check failed (will retry):', err.message);
  }
}

// Start health check only when server is running
if (process.env.NODE_ENV === 'production') {
  // In production: every 5 minutes
  setInterval(runHealthCheck, HEALTH_CHECK_INTERVAL);
  console.log('💓 Database keepalive enabled (every 5 minutes)');
} else {
  // In development: every 30 minutes (less noise)
  setInterval(runHealthCheck, 30 * 60 * 1000);
}
