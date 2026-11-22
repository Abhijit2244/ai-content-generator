import { IUserRepository, IPasswordHasher, ITokenService } from '../domain/user.js';
import { LoginInput } from '../presentation/auth-dto.js';
import { UnauthorizedError } from '../../../shared/errors/app-error.js';
import { AuthResult } from './register-user.js';

// Pre-computed constant valid bcrypt hash used to neutralize timing attacks when user is not found
const DUMMY_BCRYPT_HASH = '$2a$10$w8.3f2y.f5x8a6Z1D2N3E4G5H6J7K8L9M0N1P2Q3R4S5T6U7V8W9X';

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async execute(input: LoginInput): Promise<AuthResult> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      // Side-channel timing protection: perform constant-time hash verification to neutralize account enumeration
      await this.passwordHasher.compare(input.password, DUMMY_BCRYPT_HASH);
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.tokenService.signToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }
}
