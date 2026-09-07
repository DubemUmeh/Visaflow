import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({path: '../../.env'});

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    const res = await sql`
      UPDATE payments 
      SET provider = 'WALLET' 
      WHERE provider = 'CRYPTO'
    `;
    console.log(`Updated ${res.count} rows from CRYPTO to WALLET.`);
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

run();
