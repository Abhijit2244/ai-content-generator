import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { env } from './config/env.js';
import { prisma } from './database/prisma.js';
import { requestIdMiddleware } from './shared/middleware/request-id.js';
import { createRateLimiter } from './shared/middleware/rate-limiter.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import { NotFoundError } from './shared/errors/app-error.js';

// Auth Module
import { PrismaUserRepository } from './modules/auth/infrastructure/prisma-user-repository.js';
import { BcryptPasswordHasher } from './modules/auth/infrastructure/bcrypt-hasher.js';
import { JwtTokenService } from './modules/auth/infrastructure/jwt-token-service.js';
import { RegisterUserUseCase } from './modules/auth/application/register-user.js';
import { LoginUserUseCase } from './modules/auth/application/login-user.js';
import { GetCurrentUserUseCase } from './modules/auth/application/get-current-user.js';
import { AuthController } from './modules/auth/presentation/auth-controller.js';
import { createAuthRouter } from './modules/auth/presentation/auth-routes.js';

// Content & Generation Modules
import { PrismaContentRepository } from './modules/content/infrastructure/prisma-content-repository.js';
import { PrismaContentVersionRepository } from './modules/content/infrastructure/prisma-content-version-repository.js';
import { PrismaGenerationLogRepository } from './modules/generation/infrastructure/prisma-generation-log-repository.js';
import { HttpAiServiceClient } from './modules/generation/infrastructure/http-ai-service-client.js';

import { GenerateContentUseCase } from './modules/generation/application/generate-content.js';
import { RefineContentUseCase } from './modules/generation/application/refine-content.js';
import { CreateVariationsUseCase } from './modules/generation/application/create-variations.js';

import { ListContentUseCase } from './modules/content/application/list-content.js';
import { GetContentByIdUseCase } from './modules/content/application/get-content.js';
import { UpdateContentUseCase } from './modules/content/application/update-content.js';
import { DeleteContentUseCase } from './modules/content/application/delete-content.js';
import { ListVersionsUseCase } from './modules/content/application/list-versions.js';
import { GetVersionByIdUseCase } from './modules/content/application/get-version.js';

import { ContentController } from './modules/content/presentation/content-controller.js';
import { createContentRouter } from './modules/content/presentation/content-routes.js';

export function createApp(customPrisma?: PrismaClient) {
  const db = customPrisma || prisma;
  const app = express();

  // Security & HTTP Hardening Middleware
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", env.FRONTEND_ORIGIN, 'http://localhost:5173', 'http://localhost:5000'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(requestIdMiddleware);

  const allowedOrigins = [
    env.FRONTEND_ORIGIN,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS policy: Origin not allowed'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      maxAge: 86400,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Global API Rate Limiter: 150 req/min per IP to prevent DoS & scraping
  const globalApiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 150,
    message: 'Global API rate limit exceeded. Please throttle requests.',
  });
  app.use('/api', globalApiLimiter);

  // Dependency Composition Root
  const userRepository = new PrismaUserRepository(db);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService();

  const registerUseCase = new RegisterUserUseCase(userRepository, passwordHasher, tokenService);
  const loginUseCase = new LoginUserUseCase(userRepository, passwordHasher, tokenService);
  const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);

  const authController = new AuthController(
    registerUseCase,
    loginUseCase,
    getCurrentUserUseCase
  );

  const contentRepository = new PrismaContentRepository(db);
  const versionRepository = new PrismaContentVersionRepository(db);
  const generationLogRepository = new PrismaGenerationLogRepository(db);
  const aiServiceClient = new HttpAiServiceClient();

  const generateUseCase = new GenerateContentUseCase(db, aiServiceClient, generationLogRepository);
  const refineUseCase = new RefineContentUseCase(db, aiServiceClient, generationLogRepository);
  const variationsUseCase = new CreateVariationsUseCase(db, aiServiceClient, generationLogRepository);

  const listContentUseCase = new ListContentUseCase(contentRepository);
  const getContentByIdUseCase = new GetContentByIdUseCase(contentRepository);
  const updateContentUseCase = new UpdateContentUseCase(contentRepository, versionRepository);
  const deleteContentUseCase = new DeleteContentUseCase(contentRepository);
  const listVersionsUseCase = new ListVersionsUseCase(contentRepository, versionRepository);
  const getVersionByIdUseCase = new GetVersionByIdUseCase(contentRepository, versionRepository);

  const contentController = new ContentController(
    generateUseCase,
    refineUseCase,
    variationsUseCase,
    listContentUseCase,
    getContentByIdUseCase,
    updateContentUseCase,
    deleteContentUseCase,
    listVersionsUseCase,
    getVersionByIdUseCase
  );

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'backend-api',
      timestamp: new Date().toISOString(),
    });
  });

  // Public API Routes
  app.use('/api/v1/auth', createAuthRouter(authController));
  app.use('/api/v1/content', createContentRouter(contentController));

  // 404 handler
  app.use((_req, _res, next) => {
    next(new NotFoundError('The requested endpoint was not found'));
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
