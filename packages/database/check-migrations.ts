import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({path: '../../.env'});
const sql = postgres(process.env.DATABASE_URL!);
sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at`
  .then(res => console.log(res))
  .catch(e => console.error(e))
  .finally(() => sql.end());
