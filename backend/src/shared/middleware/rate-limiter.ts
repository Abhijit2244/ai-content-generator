import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../errors/app-error.js';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const store = new Map<string, RateLimitStore>();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = (req.user?.id || req.ip || 'anonymous') + `:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      next();
      return;
    }

    if (entry.count >= options.maxRequests) {
      throw new RateLimitError(options.message || 'Rate limit exceeded. Please wait a moment.');
    }

    entry.count += 1;
    next();
  };
}
