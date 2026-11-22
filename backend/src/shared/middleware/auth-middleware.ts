import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or invalid');
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new UnauthorizedError('Authentication token missing or invalid');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as AuthUser;

    if (!decoded || !decoded.id || !decoded.email) {
      throw new UnauthorizedError('Invalid token claims');
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || 'User',
    };
    next();
  } catch (_err) {
    throw new UnauthorizedError('Session expired or invalid token');
  }
}
