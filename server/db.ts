import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Check for required environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client
const client = postgres(process.env.DATABASE_URL, { max: 3 });

// Create drizzle database instance
export const db = drizzle(client, { schema });