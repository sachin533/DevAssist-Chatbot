import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const trusted =
  String(process.env.DB_TRUSTED_CONNECTION ?? 'true').toLowerCase() === 'true' ||
  (!process.env.DB_USER && !process.env.DB_PASSWORD);

let server = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
let port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;
// Direct TCP port connections must not include the instance name.
if (port && server.includes('\\')) {
  server = server.split('\\')[0];
}

const config = {
  server,
  database: process.env.DB_DATABASE || 'PhonebookDB',
  options: {
    encrypt: String(process.env.DB_ENCRYPT ?? 'false').toLowerCase() === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
    ...(trusted ? { trustedConnection: true } : {}),
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

if (!trusted) {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

if (process.env.DB_PORT) {
  config.port = parseInt(process.env.DB_PORT, 10);
}

let poolPromise = null;

export function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config).catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

export { sql };
export default config;
