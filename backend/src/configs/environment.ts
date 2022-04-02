import { config } from 'dotenv';

config();
export const ENVIRONMENT = {
  // Mongo DB connection
  MONGO_DB_CONNECTION: String(process.env.MONGO_DB_CONNECTION),

  // Authentication
  SECRET_KEY: process.env.SECRET_KEY,
  EXPIRES_TIME: String(process.env.EXPIRES_TIME),
};
