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
  // Keep pool small for Supabase free tier (max 3-5 direct connections)
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

export const db = drizzle(pool, { schema });

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});
