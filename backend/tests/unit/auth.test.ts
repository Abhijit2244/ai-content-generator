import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterUserUseCase } from '../../src/modules/auth/application/register-user.js';
import { LoginUserUseCase } from '../../src/modules/auth/application/login-user.js';
import { GetCurrentUserUseCase } from '../../src/modules/auth/application/get-current-user.js';
import {
  IUserRepository,
  UserEntity,
  IPasswordHasher,
  ITokenService,
} from '../../src/modules/auth/domain/user.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../src/shared/errors/app-error.js';

class InMemoryUserRepository implements IUserRepository {
  public users: UserEntity[] = [];

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

describe('Auth Unit Tests (In-Memory Isolation)', () => {
  let userRepo: InMemoryUserRepository;
  let hasher: MockPasswordHasher;
  let tokenService: MockTokenService;
  let registerUseCase: RegisterUserUseCase;
  let loginUseCase: LoginUserUseCase;
  let getCurrentUserUseCase: GetCurrentUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    hasher = new MockPasswordHasher();
    tokenService = new MockTokenService();
    registerUseCase = new RegisterUserUseCase(userRepo, hasher, tokenService);
    loginUseCase = new LoginUserUseCase(userRepo, hasher, tokenService);
    getCurrentUserUseCase = new GetCurrentUserUseCase(userRepo);
  });

  it('registers user and returns sanitized profile with token', async () => {
    const result = await registerUseCase.execute({
      name: 'Alice',
      email: 'Alice@Example.COM',
      password: 'Password123!',
    });

    expect(result.user.name).toBe('Alice');
    expect(result.user.email).toBe('alice@example.com');
    expect(result.token).toBe(`mock_token_${result.user.id}`);
  });

  it('normalizes email to lowercase during registration', async () => {
    const result = await registerUseCase.execute({
      name: 'Bob Smith',
      email: 'BOB.SMITH@DOMAIN.ORG',
      password: 'Password123!',
    });

    expect(result.user.email).toBe('bob.smith@domain.org');
  });

  it('rejects registration when email is already taken', async () => {
    await registerUseCase.execute({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123!',
    });

    await expect(
      registerUseCase.execute({
        name: 'Alice Duplicate',
        email: 'alice@example.com',
        password: 'Password123!',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('authenticates user with valid credentials', async () => {
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

  it('authenticates case-insensitively with uppercase email input', async () => {
    await registerUseCase.execute({
      name: 'Charlie',
      email: 'charlie@example.com',
      password: 'Password123!',
    });

    const result = await loginUseCase.execute({
      email: 'CHARLIE@EXAMPLE.COM',
      password: 'Password123!',
    });

    expect(result.user.email).toBe('charlie@example.com');
  });

  it('rejects login with incorrect password', async () => {
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

  it('rejects login for unregistered email', async () => {
    await expect(
      loginUseCase.execute({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('retrieves current authenticated user profile without exposing passwordHash', async () => {
    const reg = await registerUseCase.execute({
      name: 'Dave',
      email: 'dave@example.com',
      password: 'Password123!',
    });

    const profile = await getCurrentUserUseCase.execute(reg.user.id);
    expect(profile.id).toBe(reg.user.id);
    expect(profile.name).toBe('Dave');
    expect(profile.email).toBe('dave@example.com');
    expect((profile as any).passwordHash).toBeUndefined();
  });

  it('throws NotFoundError when current user ID does not exist', async () => {
    await expect(getCurrentUserUseCase.execute('missing-user-id')).rejects.toThrow(NotFoundError);
  });

  it('trims whitespace around email and name during registration', async () => {
    const result = await registerUseCase.execute({
      name: '  Trimmed User  ',
      email: '   trimmed@example.com   ',
      password: 'Password123!',
    });

    expect(result.user.name).toBe('Trimmed User');
    expect(result.user.email).toBe('trimmed@example.com');
  });

  it('trims whitespace around email during login', async () => {
    await registerUseCase.execute({
      name: 'Trimmed Test',
      email: 'trimmed.login@example.com',
      password: 'Password123!',
    });

    const result = await loginUseCase.execute({
      email: '   trimmed.login@example.com   ',
      password: 'Password123!',
    });

    expect(result.user.email).toBe('trimmed.login@example.com');
  });
});

describe('Auth Infrastructure Services (Bcrypt & JWT)', () => {
  it('BcryptPasswordHasher properly hashes and verifies passwords with salt', async () => {
    const { BcryptPasswordHasher } = await import('../../src/modules/auth/infrastructure/bcrypt-hasher.js');
    const hasher = new BcryptPasswordHasher(8);

    const rawPassword = 'SecretPassword123!';
    const hash = await hasher.hash(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const isValid = await hasher.compare(rawPassword, hash);
    expect(isValid).toBe(true);

    const isInvalid = await hasher.compare('WrongPassword456!', hash);
    expect(isInvalid).toBe(false);
  });

  it('JwtTokenService signs tokens containing valid user claims', async () => {
    const { JwtTokenService } = await import('../../src/modules/auth/infrastructure/jwt-token-service.js');
    const jwt = await import('jsonwebtoken');
    const { env } = await import('../../src/config/env.js');

    const tokenService = new JwtTokenService();
    const payload = {
      id: 'test-user-uuid-1',
      email: 'jwt@example.com',
      name: 'JWT User',
    };

    const token = tokenService.signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded: any = jwt.default.verify(token, env.JWT_SECRET);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.name).toBe(payload.name);
  });
});
