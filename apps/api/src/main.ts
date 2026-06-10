import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // CRIT-3: Fail fast if secrets are missing or too short
  const config = app.get(ConfigService);
  const jwtSecret = config.get<string>('auth.jwtSecret');
  const refreshSecret = config.get<string>('auth.refreshSecret');
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET is missing or too short (min 32 chars). Set it in .env');
  }
  if (!refreshSecret || refreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET is missing or too short (min 32 chars). Set it in .env');
  }

  app.use(helmet({
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }));

  // HIGH-3: Exact-match CORS — no wildcard subdomains
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
        .split(',').map(s => s.trim());
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');

  // MED-5: Swagger only in non-production
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LipaBit API')
      .setDescription('Bitcoin ↔ M-Pesa exchange platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  // Expose a health endpoint outside versioning/global-prefix for container probes
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: unknown, res: { status: (n: number) => { json: (v: unknown) => void } }) => {
    res.status(200).json({ status: 'ok' });
  });
  console.log(`LipaBit API running on port ${port}`);
}

bootstrap();
