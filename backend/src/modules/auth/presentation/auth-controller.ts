import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../application/register-user.js';
import { LoginUserUseCase } from '../application/login-user.js';
import { GetCurrentUserUseCase } from '../application/get-current-user.js';
import { registerSchema, loginSchema } from './auth-dto.js';
import { sendSuccess } from '../../../shared/http/response.js';
import { UnauthorizedError } from '../../../shared/errors/app-error.js';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUserUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await this.registerUseCase.execute(validated);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await this.loginUseCase.execute(validated);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, { message: 'Successfully logged out' }, 200);
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError();
      }
      const user = await this.getCurrentUserUseCase.execute(req.user.id);
      sendSuccess(res, user, 200);
    } catch (err) {
      next(err);
    }
  };
}
