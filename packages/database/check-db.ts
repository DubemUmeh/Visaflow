import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({path: '../../.env'});

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    const cols = await sql`
      SELECT data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'provider'
    `;
    console.log('payments.provider type:', cols);
    
    // Check rows with CRYPTO
    const rows = await sql`
      SELECT id, provider FROM payments WHERE provider::text = 'CRYPTO'
    `;
    console.log('Rows with CRYPTO:', rows);

    // check if there are other columns that use PaymentProvider
    const enumCols = await sql`
      SELECT table_name, column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE udt_name = 'PaymentProvider'
    `;
    console.log('Columns with PaymentProvider type:', enumCols);

  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

run();
