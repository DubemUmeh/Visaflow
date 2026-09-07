import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config({path: '../../.env'});
const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    const migrations = [
      'drizzle/0003_internal_wallet.sql',
      'drizzle/0004_r2_document_storage.sql'
    ];

    for (const file of migrations) {
      const sqlContent = fs.readFileSync(file, 'utf8');
      
      // Compute drizzle hash
      const hash = crypto.createHash('sha256').update(sqlContent).digest('hex');
      
      // We need to insert this into drizzle.__drizzle_migrations if it doesn't exist.
      const existing = await sql`SELECT * FROM drizzle.__drizzle_migrations WHERE hash = ${hash}`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at) 
          VALUES (${hash}, ${Date.now()})
        `;
        console.log(`Inserted migration record for ${file}`);
      } else {
        console.log(`Migration record already exists for ${file}`);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

run();
