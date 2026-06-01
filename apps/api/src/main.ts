/**
 * VisaFlow API — NestJS Application Entry Point
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

  // ── Security ────────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: nodeEnv === 'production',
    }),
  );
  app.use(compression());

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Accept-Language'],
    exposedHeaders: ['X-Request-ID', 'X-Total-Count'],
  });

  // ── API Versioning ────────────────────────────────────────────────────────
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // ── Global Pipes ──────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
      errorHttpStatusCode: 422,
    }),
  );

  // ── Global Filters & Interceptors ─────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new ResponseTransformInterceptor(),
    new RequestLoggerInterceptor(),
  );

  // ── Swagger API Docs ───────────────────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('VisaFlow API')
      .setDescription(
        'Production-grade visa processing platform API. All endpoints require authentication unless marked as public.',
      )
      .setVersion('1.0')
      .setContact('VisaFlow Support', 'https://visaflow.com', 'support@visaflow.com')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT',
      )
      .addTag('auth', 'Authentication & authorization')
      .addTag('users', 'User profile management')
      .addTag('countries', 'Country directory')
      .addTag('visa-types', 'Visa type catalog')
      .addTag('eligibility', 'Visa eligibility checker')
      .addTag('applications', 'Visa application management')
      .addTag('documents', 'Document upload & management')
      .addTag('payments', 'Payment processing')
      .addTag('notifications', 'Notification management')
      .addTag('support', 'Customer support tickets')
      .addTag('ai', 'AI-powered features')
      .addTag('admin', 'Admin operations')
      .addTag('health', 'Health checks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'method',
      },
    });
  }

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port);

  console.log(`
╔════════════════════════════════════════════╗
║          VisaFlow API Server               ║
╠════════════════════════════════════════════╣
║ Environment: ${nodeEnv.padEnd(29)}║
║ Port:        ${String(port).padEnd(29)}║
║ API:         http://localhost:${port}/api/v1  ║
║ Docs:        http://localhost:${port}/api/docs║
╚════════════════════════════════════════════╝
  `);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
