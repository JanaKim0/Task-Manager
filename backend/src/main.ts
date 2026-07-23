// Загружает переменные из .env в process.env. Должно идти самой первой строкой.
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Все маршруты начинаются с /api — так их удобно отличать от статики.
  app.setGlobalPrefix('api');

  // Автоматическая валидация тел запросов по правилам из DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // выкидывает поля, которых нет в DTO
      forbidNonWhitelisted: true, // и ругается, если они пришли
      transform: true, // приводит типы (строка "1" -> число 1)
    }),
  );

  // Angular работает на другом порту, без CORS браузер заблокирует запросы.
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API запущено на http://localhost:${port}/api`);
}

void bootstrap();
