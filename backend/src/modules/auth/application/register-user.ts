import { IUserRepository, IPasswordHasher, ITokenService, UserPublicDto } from '../domain/user.js';
import { RegisterInput } from '../presentation/auth-dto.js';
import { ConflictError } from '../../../shared/errors/app-error.js';

export interface AuthResult {
  user: UserPublicDto;
  token: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async execute(input: RegisterInput): Promise<AuthResult> {
    const normalizedName = input.name.trim();
    const normalizedEmail = input.email.toLowerCase().trim();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
    });

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
