import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  frontendUrl: string;
  apiUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    environment: 'sandbox' | 'live';
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3Bucket: string;
    s3Endpoint?: string;
    cdnUrl?: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    apiUrl: process.env.API_URL ?? 'http://localhost:4000',

    jwtSecret: process.env.JWT_SECRET ?? 'CHANGE_ME_IN_PRODUCTION_32_CHARS_MIN',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshTokenSecret:
      process.env.REFRESH_TOKEN_SECRET ?? 'CHANGE_ME_REFRESH_SECRET',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',

    database: {
      url:
        process.env.DATABASE_URL ??
        (() => {
          if (process.env.NODE_ENV === 'production') {
            throw new Error('Missing DATABASE_URL environment variable');
          }
          return 'postgresql://user:password@localhost:5432/visaflow';
        })(),
    },

    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD,
    },


    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID ?? '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
      environment:
        (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live') ?? 'sandbox',
    },

    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      region: process.env.AWS_REGION ?? 'us-east-1',
      s3Bucket: process.env.AWS_S3_BUCKET ?? 'visaflow-documents',
      s3Endpoint: process.env.AWS_S3_ENDPOINT, // For MinIO/custom endpoints
      cdnUrl: process.env.AWS_CDN_URL,
    },

    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? '',
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    },

    resend: {
      apiKey: process.env.RESEND_API_KEY ?? '',
      fromEmail: process.env.RESEND_FROM_EMAIL ?? 'noreply@visaflow.com',
    },

    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
      authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
      fromNumber: process.env.TWILIO_FROM_NUMBER ?? '',
    },

    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:4000/api/v1/auth/google/callback',
    },
  }),
);
