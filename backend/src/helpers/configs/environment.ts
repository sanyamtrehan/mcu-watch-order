import { config } from 'dotenv';

config();
export const ENVIRONMENT = {
  // Postgres (Supabase)
  DATABASE_URL: String(process.env.DATABASE_URL),
  DATABASE_SSL: process.env.DATABASE_SSL === 'true',

  // Authentication
  SECRET_KEY: process.env.SECRET_KEY,
  EXPIRES_TIME: String(process.env.EXPIRES_TIME),

  // Data upload secret key
  MCU_SECRET_KEY: String(process.env.MCU_SECRET_KEY),

  PORT: Number(process.env.PORT),
};
