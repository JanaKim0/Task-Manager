import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { AppModule } from './app.module';

export interface ServerOptions {
  /** 0 asks the operating system for any free port. */
  port?: number;
  /** Browser origin allowed to call the API. Not needed when serving the UI. */
  corsOrigin?: string;
  /** Folder with the built Angular app. When set, the UI is served too. */
  staticDir?: string;
}

export interface RunningServer {
  url: string;
  port: number;
  close: () => Promise<void>;
}

/**
 * Creates and starts the API.
 *
 * Written as a function rather than a script so the desktop app can start
 * the same server inside its own process — one program instead of two, and
 * no second terminal for the user to keep open.
 */
export async function startServer(
  options: ServerOptions = {},
): Promise<RunningServer> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // The desktop window shows its own errors; a wall of logs is noise there.
    logger: options.staticDir ? ['error', 'warn'] : undefined,
  });

  // Every route starts with /api, which keeps it apart from the UI files.
  app.setGlobalPrefix('api');

  // Validates request bodies against the rules declared in the DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties not declared in the DTO
      forbidNonWhitelisted: true, // ...and rejects the request if any are sent
      transform: true, // converts types ("1" -> 1, ISO string -> Date)
    }),
  );

  if (options.staticDir && existsSync(options.staticDir)) {
    // Desktop mode: the UI is served by this same server, so the browser
    // sees one origin and CORS never comes into play.
    app.useStaticAssets(options.staticDir);

    const indexHtml = join(options.staticDir, 'index.html');

    // Angular handles its own routing, so a deep link like /boards/<id> must
    // still return index.html instead of a 404.
    app.use((req: any, res: any, next: () => void) => {
      const isPageRequest =
        req.method === 'GET' &&
        !req.path.startsWith('/api') &&
        !req.path.includes('.');

      if (isPageRequest) {
        res.sendFile(indexHtml);
        return;
      }
      next();
    });
  } else {
    // Development: Angular runs on its own port, so the browser needs to be
    // told that calls to this one are allowed.
    app.enableCors({
      origin: options.corsOrigin ?? 'http://localhost:4200',
    });
  }

  const port = options.port ?? 3333;
  await app.listen(port);

  // With port 0 the real port is only known after listening.
  const address = app.getHttpServer().address();
  const actualPort = typeof address === 'object' && address ? address.port : port;

  return {
    port: actualPort,
    url: `http://localhost:${actualPort}`,
    close: () => app.close(),
  };
}
