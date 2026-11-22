import { Router } from 'express';
import { AuthController } from './auth-controller.js';
import { authMiddleware } from '../../../shared/middleware/auth-middleware.js';
import { createRateLimiter } from '../../../shared/middleware/rate-limiter.js';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 30,
    message: 'Too many authentication attempts. Please try again later.',
  });

  router.post('/register', authLimiter, controller.register);
  router.post('/login', authLimiter, controller.login);
  router.post('/logout', authMiddleware, controller.logout);
  router.get('/me', authMiddleware, controller.me);

  return router;
}
