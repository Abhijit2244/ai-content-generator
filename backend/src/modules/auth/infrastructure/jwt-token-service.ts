import jwt from 'jsonwebtoken';
import { ITokenService } from '../domain/user.js';
import { env } from '../../../config/env.js';

export class JwtTokenService implements ITokenService {
  signToken(payload: { id: string; email: string; name: string }): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    });
  }
}
