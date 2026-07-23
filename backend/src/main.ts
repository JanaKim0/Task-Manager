// Loads variables from .env into process.env. Must be the very first import.
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Every route starts with /api, which keeps it apart from static files.
  app.setGlobalPrefix('api');

  // Validates request bodies against the rules declared in the DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties not declared in the DTO
      forbidNonWhitelisted: true, // ...and rejects the request if any are sent
      transform: true, // converts types ("1" -> 1, ISO string -> Date)
    }),
  );

  // Angular runs on a different port, so without CORS the browser blocks calls.
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API running at http://localhost:${port}/api`);
}

void bootstrap();
