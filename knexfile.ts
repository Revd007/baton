import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config({ path: ".env" }); // Ensure .env is loaded

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg", // Use 'pg' for PostgreSQL
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Optional: for SSL connections
    },
    migrations: {
      directory: "./db/migrations", // We'll create this directory
      tableName: "knex_migrations",
      extension: 'ts', // For TypeScript migrations
    },
    seeds: {
      directory: "./db/seeds", // We'll create this directory for seed files
      extension: 'ts',
    },
  },

  // Remove or configure staging and production similarly if needed
  // For now, we focus on development
  staging: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST_STAGING,
      port: Number(process.env.DB_PORT_STAGING),
      user: process.env.DB_USER_STAGING,
      password: process.env.DB_PASSWORD_STAGING,
      database: process.env.DB_NAME_STAGING,
      ssl: process.env.DB_SSL_STAGING === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: "./db/migrations",
      tableName: "knex_migrations",
      extension: 'ts',
    }
  },

  production: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST_PRODUCTION,
      port: Number(process.env.DB_PORT_PRODUCTION),
      user: process.env.DB_USER_PRODUCTION,
      password: process.env.DB_PASSWORD_PRODUCTION,
      database: process.env.DB_NAME_PRODUCTION,
      ssl: process.env.DB_SSL_PRODUCTION === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: "./db/migrations",
      tableName: "knex_migrations",
      extension: 'ts',
    }
  }
};

export default config; // Use ES module export
