// Loads variables from .env into process.env. Must be the very first import.
import 'dotenv/config';

import { startServer } from './server';

/**
 * Standalone entry point: `npm run start:dev` during development.
 * The desktop app does not use this file — it calls startServer() itself.
 */
async function bootstrap() {
  const { url } = await startServer({
    port: Number(process.env.PORT ?? 3333),
    corsOrigin: process.env.CORS_ORIGIN,
  });

  console.log(`API running at ${url}/api`);
}

void bootstrap();
