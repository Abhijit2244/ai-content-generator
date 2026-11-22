import { IUserRepository, UserPublicDto } from '../domain/user.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserPublicDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
