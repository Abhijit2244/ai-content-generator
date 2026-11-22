import { IContentRepository } from '../domain/content.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';

export class DeleteContentUseCase {
  constructor(private readonly contentRepository: IContentRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const existing = await this.contentRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundError('Content document not found');
    }

    await this.contentRepository.delete(id, userId);
  }
}
