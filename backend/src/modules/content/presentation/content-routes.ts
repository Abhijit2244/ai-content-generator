import { Router } from 'express';
import { ContentController } from './content-controller.js';
import { authMiddleware } from '../../../shared/middleware/auth-middleware.js';
import { createRateLimiter } from '../../../shared/middleware/rate-limiter.js';

export function createContentRouter(controller: ContentController): Router {
  const router = Router();

  const generationLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many content generation requests. Please slow down.',
  });

  router.use(authMiddleware);

  // Generation & AI operations
  router.post('/generate', generationLimiter, controller.generate);
  router.post('/:id/refine', generationLimiter, controller.refine);
  router.post('/:id/variations', generationLimiter, controller.variations);

  // CRUD operations
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);

  // Version history operations
  router.get('/:id/versions', controller.listVersions);
  router.get('/:id/versions/:versionId', controller.getVersionById);

  return router;
}
