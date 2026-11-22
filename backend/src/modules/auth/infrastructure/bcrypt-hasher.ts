import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../domain/user.js';

export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly rounds: number;

  constructor(rounds = 10) {
    this.rounds = rounds;
  }

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.rounds);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
