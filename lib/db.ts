import knex from 'knex';
import knexConfig from '../knexfile';

// Determine the environment
// Default to 'development' if NODE_ENV is not set
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

if (!config) {
  throw new Error(`Knex configuration for environment '${environment}' not found.`);
}

const db = knex(config);

export default db; 