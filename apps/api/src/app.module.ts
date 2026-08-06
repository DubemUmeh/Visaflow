// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { AdminModule } from './admin/admin.module';
// import { AiModule } from './ai/ai.module';
// import { ApplicationModule } from './application/application.module';
// import { CountriesModule } from './countries/countries.module';
// import { DocumentsModule } from './documents/documents.module';
// import { EligibilityModule } from './eligibility/eligibility.module';
// import { NotificationsModule } from './notifications/notifications.module';
// import { PaymentsModule } from './payments/payments.module';
// import { SupportModule } from './support/support.module';
// import { UsersModule } from './users/users.module';
// import { AuthModule } from './auth/auth.module';
// import { VisaTypesModule } from './visa-types/visa-types.module';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppConfig, appConfig } from './common/config/app.config';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CountriesModule } from './countries/countries.module';
import { VisaTypesModule } from './visa-types/visa-types.module';
import { EligibilityModule } from './eligibility/eligibility.module';
import { ApplicationModule } from './application/application.module';
import { DocumentsModule } from './documents/documents.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupportModule } from './support/support.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { WalletModule } from './wallet/wallet.module';
import { RealtimeModule } from './realtime/realtime.module';

for (const envFile of ['apps/api/.env', '.env.local', '.env']) {
  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }
}
const redisEnabled = process.env.REDIS_ENABLED !== 'false';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['apps/api/.env', '.env.local', '.env'],
      expandVariables: true,
      cache: true,
    }),

    // ── Rate Limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: config.get('THROTTLE_SHORT_LIMIT', 10),
          },
          {
            name: 'medium',
            ttl: 10000,
            limit: config.get('THROTTLE_MEDIUM_LIMIT', 50),
          },
          {
            name: 'long',
            ttl: 60000,
            limit: config.get('THROTTLE_LONG_LIMIT', 200),
          },
        ],
      }),
    }),

    // ── Cache (Redis) ────────────────────────────────────────────────────────
    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   inject: [ConfigService],
    //   useFactory: async (config: ConfigService) => ({
    //     store: await redisStore({
    //       socket: {
    //         host: config.get('REDIS_HOST', 'localhost'),
    //         port: config.get<number>('REDIS_PORT', 6379),
    //       },
    //       password: config.get('REDIS_PASSWORD'),
    //       database: 0,
    //       ttl: 300,
    //     }),
    //   }),
    // }),

    // COnditional for redis availability
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        if (!redisEnabled) {
          return {
            ttl: 300,
          };
        }

        return {
          store: await redisStore({
            socket: {
              host: config.get('REDIS_HOST', 'localhost'),
              port: config.get<number>('REDIS_PORT', 6379),
            },
            password: config.get('REDIS_PASSWORD'),
            database: 0,
            ttl: 300,
          }),
        };
      },
    }),

    ...(redisEnabled
      ? [
          BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              redis: {
                host: config.get('REDIS_HOST', 'localhost'),
                port: config.get<number>('REDIS_PORT', 6379),
                password: config.get('REDIS_PASSWORD'),
              },
              defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 200,
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
              },
            }),
          }),
        ]
      : []),

    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   inject: [ConfigService],
    //   useFactory: async (config: ConfigService) => ({
    //     store: await redisStore({
    //       socket: {
    //         host: config.get<string>('REDIS_HOST', 'localhost'),
    //         port: config.get<number>('REDIS_PORT', 6379),
    //       },
    //       password: config.get<string>('REDIS_PASSWORD'),
    //       database: config.get<number>('REDIS_DB', 0),
    //     }),
    //     ttl: 300,
    //   }),
    // }),

    // ── Bull Queues ──────────────────────────────────────────────────────────
    // ── Events ───────────────────────────────────────────────────────────────
    EventEmitterModule.forRoot({ wildcard: true, maxListeners: 20 }),

    // ── Scheduling ───────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Feature Modules ───────────────────────────────────────────────────────
    DatabaseModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    CountriesModule,
    VisaTypesModule,
    EligibilityModule,
    ApplicationModule,
    DocumentsModule,
    PaymentsModule,
    WalletModule,
    NotificationsModule,
    SupportModule,
    AiModule,
    AdminModule,
  ],
})
export class AppModule {}
