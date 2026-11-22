export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublicDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(data: { name: string; email: string; passwordHash: string }): Promise<UserEntity>;
}

export interface IPasswordHasher {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  signToken(payload: { id: string; email: string; name: string }): string;
}
