import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { db as sharedDb } from '@visaflow/database';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  [key: string]: any;
  private readonly logger = new Logger(DatabaseService.name);
  readonly db = sharedDb;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      await this.db.execute(sql`SELECT 1`);
      this.logger.log('Database connection (shared) available');
    } catch (error) {
      this.logger.error('Failed to use shared database', error as Error);
      throw error;
    }
  }

  async onModuleDestroy() {
    // The shared database client lifecycle is managed by @visaflow/database
    this.logger.log('DatabaseService shutdown (shared db)');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase is not allowed in production');
    }

    const tableNames = await this.db.execute(sql`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);

    for (const row of tableNames as unknown as Array<{ tablename: string }>) {
      if (row.tablename !== 'drizzle_migrations') {
        await this.db.execute(sql.raw(`TRUNCATE TABLE "${row.tablename}" CASCADE;`));
      }
    }
  }
}
