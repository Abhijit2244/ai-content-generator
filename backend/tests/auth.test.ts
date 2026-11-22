import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterUserUseCase } from '../src/modules/auth/application/register-user.js';
import { LoginUserUseCase } from '../src/modules/auth/application/login-user.js';
import { IUserRepository, UserEntity, IPasswordHasher, ITokenService } from '../src/modules/auth/domain/user.js';
import { ConflictError, UnauthorizedError } from '../src/shared/errors/app-error.js';

class InMemoryUserRepository implements IUserRepository {
  private users: UserEntity[] = [];

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<UserEntity> {
    const user: UserEntity = {
      id: `user-${Date.now()}-${Math.random()}`,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }
}

class MockPasswordHasher implements IPasswordHasher {
  async hash(plainText: string): Promise<string> {
    return `hashed_${plainText}`;
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return hash === `hashed_${plainText}`;
  }
}

class MockTokenService implements ITokenService {
  signToken(payload: { id: string; email: string; name: string }): string {
    return `mock_token_${payload.id}`;
  }
}

describe('Auth Use Cases', () => {
  let userRepo: InMemoryUserRepository;
  let hasher: MockPasswordHasher;
  let tokenService: MockTokenService;
  let registerUseCase: RegisterUserUseCase;
  let loginUseCase: LoginUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    hasher = new MockPasswordHasher();
    tokenService = new MockTokenService();
    registerUseCase = new RegisterUserUseCase(userRepo, hasher, tokenService);
    loginUseCase = new LoginUserUseCase(userRepo, hasher, tokenService);
  });

  it('should successfully register a new user and return user info with token', async () => {
    const result = await registerUseCase.execute({
      name: 'Alice',
      email: 'Alice@Example.COM',
      password: 'Password123!',
    });

    expect(result.user.name).toBe('Alice');
    expect(result.user.email).toBe('alice@example.com');
    expect(result.token).toBe(`mock_token_${result.user.id}`);
  });

  it('should reject registration if email is already taken', async () => {
    await registerUseCase.execute({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123!',
    });

    await expect(
      registerUseCase.execute({
        name: 'Alice Two',
        email: 'alice@example.com',
        password: 'Password123!',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should successfully login an existing user with valid credentials', async () => {
    await registerUseCase.execute({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'Password123!',
    });

    const result = await loginUseCase.execute({
      email: 'bob@example.com',
      password: 'Password123!',
    });

    expect(result.user.name).toBe('Bob');
    expect(result.token).toBe(`mock_token_${result.user.id}`);
  });

  it('should reject login with wrong password', async () => {
    await registerUseCase.execute({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'Password123!',
    });

    await expect(
      loginUseCase.execute({
        email: 'bob@example.com',
        password: 'WrongPassword!',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should reject login for non-existent email', async () => {
    await expect(
      loginUseCase.execute({
        email: 'nobody@example.com',
        password: 'Password123!',
      })
    ).rejects.toThrow(UnauthorizedError);
  });
});
