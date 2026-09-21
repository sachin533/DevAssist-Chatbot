import dotenv from 'dotenv';
import app from './src/app.js';
import { getPool } from './src/config/db.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

async function main() {
  try {
    await getPool();
    console.log('Connected to SQL Server.');
  } catch (err) {
    console.error('Database connection failed. Check .env and ensure SQL Server Express is running.');
    console.error(err?.message ?? err);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Phonebook server listening on http://localhost:${PORT}`);
  });
}

main();
