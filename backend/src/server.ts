import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './database/prisma.js';
import { seedDatabase } from './database/seed.js';

async function bootstrap() {
  // Ensure database has initial demo accounts if empty, but preserve all existing data and changes
  try {
    await seedDatabase(prisma);
  } catch (err) {
    logger.warn('Seed check completed with warning (non-blocking)', { error: String(err) });
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Backend API server started successfully`, {
      port: env.PORT,
      nodeEnv: env.NODE_ENV,
      url: `http://localhost:${env.PORT}`,
    });
  });

  async function shutdown(signal: string) {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Database connection closed. Exiting process.');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: String(err) });
  process.exit(1);
});
