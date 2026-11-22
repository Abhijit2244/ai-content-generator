import { PrismaClient } from '@prisma/client';
import { IUserRepository, UserEntity } from '../domain/user.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return user;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user;
  }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
      },
    });
    return user;
  }
}
