import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  // Check if our application columns are already nullable
  const rows = await sql`
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'applications' 
    AND column_name IN (
      'destination_country_id', 
      'nationality_country_id', 
      'applicant_first_name', 
      'applicant_last_name', 
      'applicant_email'
    )
    ORDER BY column_name
  `;
  for (const row of rows) {
    console.log(`${row.column_name}: nullable=${row.is_nullable}`);
  }
  await sql.end();
}

main();
